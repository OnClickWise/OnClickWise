"use client"

import * as React from "react"
import { useWhatsAppWebSocket } from "@/hooks/useWhatsAppWebSocket"
import { AppSidebar } from "@/components/app-sidebar"
import AuthGuard from "@/components/AuthGuard"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { 
  MessageSquare,
  Save,
  CheckCircle,
  AlertCircle,
  Loader2,
  QrCode,
  LogOut,
  Trash2
} from 'lucide-react'
import { whatsappService } from "@/services/whatsapp.service"
import Image from "next/image"

interface WhatsAppInstance {
  instance: {
    instanceName: string;
    instanceId?: string;
    status?: string;
    owner?: string;
    profileName?: string;
    profilePictureUrl?: string;
  };
  hash?: {
    apikey?: string;
  };
}

interface QRCodeData {
  code?: string;
  base64?: string;
  pairingCode?: string;
  lastUpdate?: number;
}

export default function WhatsAppSettingsPage({
  params,
}: {
  params: Promise<{ org: string }>
}) {
  const { org } = React.use(params)
  
  const [instances, setInstances] = React.useState<WhatsAppInstance[]>([])
  const [saving, setSaving] = React.useState(false)
  const [hasExistingInstance, setHasExistingInstance] = React.useState(false)
  
  // Form fields para nova instância
  const [instanceName, setInstanceName] = React.useState('')
  const [showForm, setShowForm] = React.useState(false)
  
  // QR Code
  const [loadingQR, setLoadingQR] = React.useState<string | null>(null)
  const [qrCodeData, setQrCodeData] = React.useState<Record<string, QRCodeData>>({})
  const [qrCodeRefreshTimers, setQrCodeRefreshTimers] = React.useState<Record<string, NodeJS.Timeout>>({})
  
  // WebSocket status
  const [isWebSocketConnected, setIsWebSocketConnected] = React.useState(false)
  
  // Ref para armazenar função de refresh (para evitar problema de ordem de declaração)
  const startQRCodeRefreshRef = React.useRef<((instanceName: string) => void) | null>(null)

  // Processar e armazenar QR Code
  const processAndStoreQRCode = React.useCallback((instanceName: string, qrcode: string | { base64?: string; code?: string; pairingCode?: string; [key: string]: unknown }, pairingCode?: string) => {
    let base64: string | undefined
    let code: string | undefined = pairingCode

    if (typeof qrcode === 'string') {
      // Se for string, pode ser base64 direto ou URL
      if (qrcode.startsWith('data:image')) {
        base64 = qrcode
      } else if (qrcode.startsWith('http')) {
        // Se for URL, precisamos converter para base64 (isso seria ideal fazer no backend)
        base64 = qrcode
      } else {
        // Assumir que é base64 sem prefixo
        base64 = `data:image/png;base64,${qrcode}`
      }
    } else if (qrcode && typeof qrcode === 'object') {
      base64 = qrcode.base64 as string | undefined
      code = (qrcode.pairingCode || qrcode.code || pairingCode) as string | undefined
      
      // Se base64 não tem prefixo, adicionar
      if (base64 && !base64.startsWith('data:image')) {
        base64 = `data:image/png;base64,${base64}`
      }
    }

    if (base64) {
      setQrCodeData(prev => ({
        ...prev,
        [instanceName]: {
          base64,
          pairingCode: code
        }
      }))
      return true
    }
    return false
  }, [])

  // Parar refresh automático do QR Code
  const stopQRCodeRefresh = React.useCallback((instanceName: string) => {
    setQrCodeRefreshTimers(prev => {
      const timer = prev[instanceName]
      if (timer) {
        clearInterval(timer)
        const newTimers = { ...prev }
        delete newTimers[instanceName]
        return newTimers
      }
      return prev
    })
  }, [])

  // WebSocket para atualizações em tempo real
  const { isConnected: wsConnected } = useWhatsAppWebSocket(
    // onStatusUpdate
    React.useCallback((status: { instanceName: string; status: string; owner?: string; profileName?: string; profilePicUrl?: string }) => {
      console.log('🔄 [Frontend] Atualização de status via WebSocket:', status);
      setInstances(prev => {
        const existingIndex = prev.findIndex(inst => inst.instance.instanceName === status.instanceName);
        
        if (existingIndex >= 0) {
          // Instância já existe, apenas atualizar
          return prev.map(inst => 
            inst.instance.instanceName === status.instanceName 
              ? { 
                  ...inst, 
                  instance: { 
                    ...inst.instance, 
                    status: status.status,
                    owner: status.owner || inst.instance.owner,
                    profileName: status.profileName || inst.instance.profileName,
                    profilePictureUrl: status.profilePicUrl || inst.instance.profilePictureUrl
                  } 
                }
              : inst
          );
        } else {
          // Instância não existe, adicionar
          return [...prev, {
            instance: {
              instanceName: status.instanceName,
              status: status.status,
              owner: status.owner,
              profileName: status.profileName,
              profilePictureUrl: status.profilePicUrl
            }
          }];
        }
      });
    }, []),
    
    // onQRCodeUpdate
    React.useCallback((update: { instanceName: string; qrcode: string; pairingCode?: string }) => {
      console.log('📱 [Frontend] QR Code atualizado via WebSocket:', update);
      processAndStoreQRCode(update.instanceName, update.qrcode, update.pairingCode);
    }, [processAndStoreQRCode]),
    
    // onConnected
    React.useCallback((instanceName: string, owner?: string, profileName?: string) => {
      console.log('✅ [Frontend] Instância conectada via WebSocket:', instanceName);
      
      // Parar refresh automático
      stopQRCodeRefresh(instanceName);
      
      // Remover QR Code
      setQrCodeData(prev => {
        const newData = { ...prev };
        delete newData[instanceName];
        return newData;
      });
      
      // Atualizar status - adiciona instância se não existir
      setInstances(prev => {
        const existingIndex = prev.findIndex(inst => inst.instance.instanceName === instanceName);
        
        if (existingIndex >= 0) {
          // Instância já existe, apenas atualizar
          return prev.map(inst => 
            inst.instance.instanceName === instanceName 
              ? { 
                  ...inst, 
                  instance: { 
                    ...inst.instance, 
                    status: 'open',
                    owner: owner || inst.instance.owner,
                    profileName: profileName || inst.instance.profileName
                  } 
                }
              : inst
          );
        } else {
          // Instância não existe, adicionar
          return [...prev, {
            instance: {
              instanceName,
              status: 'open',
              owner,
              profileName
            }
          }];
        }
      });
      
      // Mostrar notificação de sucesso
      alert(`✅ WhatsApp conectado com sucesso!\n\nInstância: ${instanceName}${profileName ? `\nNome: ${profileName}` : ''}${owner ? `\nNúmero: ${owner}` : ''}`);
    }, [stopQRCodeRefresh]),
    
    // onDisconnected
    React.useCallback((instanceName: string) => {
      console.log('❌ [Frontend] Instância desconectada via WebSocket:', instanceName);
      setInstances(prev => {
        const existingIndex = prev.findIndex(inst => inst.instance.instanceName === instanceName);
        
        if (existingIndex >= 0) {
          // Instância já existe, apenas atualizar status
          return prev.map(inst => 
            inst.instance.instanceName === instanceName 
              ? { 
                  ...inst, 
                  instance: { 
                    ...inst.instance, 
                    status: 'close'
                  } 
                }
              : inst
          );
        } else {
          // Instância não existe, adicionar como desconectada
          return [...prev, {
            instance: {
              instanceName,
              status: 'close'
            }
          }];
        }
      });
    }, [])
  );

  // Atualizar estado do WebSocket quando conexão mudar
  React.useEffect(() => {
    setIsWebSocketConnected(wsConnected)
  }, [wsConnected])

  // Criar nova instância
  const handleCreateInstance = async () => {
    if (!instanceName.trim()) {
      alert('Por favor, preencha o nome da instância')
      return
    }

    // Verificar se já existe instância para esta organização
    if (hasExistingInstance) {
      alert('Esta organização já possui uma instância WhatsApp. Apenas uma instância por organização é permitida.')
      return
    }

    try {
      setSaving(true)
      
      console.log('🔄 Criando instância:', instanceName)
      
      // Verificar novamente antes de criar
      const checkResp = await whatsappService.checkOrganizationInstance()
      if (checkResp.success && checkResp.data?.exists) {
        alert('Esta organização já possui uma instância WhatsApp. Apenas uma instância por organização é permitida.')
        setSaving(false)
        return
      }
      
      const response = await whatsappService.createWhatsAppInstance({
        instanceName: instanceName.trim(),
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS',
          webhook: {
            url: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/whatsapp/webhook/receive`,
            byEvents: false, // false = usar URL fixa, true = adicionar evento na URL
            base64: true,
            events: ['CONNECTION_UPDATE', 'QRCODE_UPDATED']
          }
      })
      
      console.log('✅ Resposta da API:', response)
      
      if (response.success) {
        // Atualizar estado para indicar que agora existe uma instância
        setHasExistingInstance(true)
        alert('Instância criada com sucesso! Agora conecte escaneando o QR Code.')
        setInstanceName('')
        setShowForm(false)
        
        // Recarregar dados da instância criada
        const checkResp = await whatsappService.checkOrganizationInstance()
        if (checkResp.success && checkResp.data?.exists && checkResp.data.instance) {
          const record = checkResp.data.instance
          const name = record.instance_name ?? record.instanceName ?? 'whatsapp'
          setInstances([
            {
              instance: {
                instanceName: name,
                status: record.status,
                owner: record.meta?.instance?.owner ?? record.meta?.owner,
                profileName: record.meta?.instance?.profileName ?? record.meta?.profileName,
                profilePictureUrl: record.meta?.instance?.profilePicUrl ?? record.meta?.profilePicUrl,
              },
            },
          ])
          if (record.qrcode) {
            setQrCodeData({
              [name]: { base64: record.qrcode },
            })
          }
        }
        
        // Conectar automaticamente para gerar QR Code
        if (response.data?.instance?.instanceName) {
          await handleConnectInstance(response.data.instance.instanceName)
        }
      } else {
        alert(`Erro ao criar instância: ${response.error}`)
      }
    } catch (error) {
      console.error('❌ Erro ao criar instância:', error)
      alert('Erro ao criar instância. Verifique se a Evolution API está rodando.')
    } finally {
      setSaving(false)
    }
  }



  // Função para iniciar refresh automático do QR Code
  const startQRCodeRefresh = React.useCallback((instanceName: string) => {
    // Limpar timer existente se houver
    stopQRCodeRefresh(instanceName)
    
    // Configurar refresh do QR Code a cada 20 segundos
    const qrRefreshInterval = 20000 // 20 segundos
    
    let lastQRRefresh = Date.now()
    
    // Timer principal que atualiza o QR Code periodicamente
    const timer = setInterval(async () => {
      try {
        // Se passou tempo suficiente desde o último refresh do QR Code, gerar novo
        const timeSinceLastRefresh = Date.now() - lastQRRefresh
        if (timeSinceLastRefresh >= qrRefreshInterval) {
          console.log(`🔄 Refresh automático do QR Code para: ${instanceName}`)
          
          // Gerar novo QR Code
          const response = await whatsappService.connectWhatsAppInstance(instanceName)
          
          if (response.success && response.data?.qrcode) {
            const success = processAndStoreQRCode(instanceName, response.data.qrcode)
            if (success) {
              console.log(`✅ QR Code atualizado para: ${instanceName}`)
              lastQRRefresh = Date.now()
            }
          } else {
            console.warn(`⚠️ Não foi possível atualizar QR Code para: ${instanceName}`)
          }
        }
      } catch (error) {
        console.error(`❌ Erro ao atualizar QR Code para ${instanceName}:`, error)
      }
    }, qrRefreshInterval)
    
    setQrCodeRefreshTimers(prev => ({
      ...prev,
      [instanceName]: timer
    }))
    
    console.log(`🔄 Refresh automático iniciado para: ${instanceName}`)
    console.log(`   - Refresh do QR Code a cada ${qrRefreshInterval/1000}s`)
  }, [stopQRCodeRefresh, processAndStoreQRCode])

  // Atualizar ref quando função for criada
  React.useEffect(() => {
    startQRCodeRefreshRef.current = startQRCodeRefresh
  }, [startQRCodeRefresh])

  // Carregar instância existente da organização e verificar se já possui instância
  React.useEffect(() => {
    let mounted = true
    ;(async () => {
      const resp = await whatsappService.checkOrganizationInstance()
      if (!mounted) return
      
      if (resp.success && resp.data?.exists && resp.data.instance) {
        setHasExistingInstance(true)
        const record = resp.data.instance
        const name = record.instance_name ?? record.instanceName ?? 'whatsapp'
        
        // Verificar se a instância já está conectada
        const isConnected = record.status === 'open' || record.status === 'CONNECTED'
        
        setInstances([
          {
            instance: {
              instanceName: name,
              status: record.status,
              owner: record.meta?.instance?.owner ?? record.meta?.owner,
              profileName: record.meta?.instance?.profileName ?? record.meta?.profileName,
              profilePictureUrl: record.meta?.instance?.profilePicUrl ?? record.meta?.profilePicUrl,
            },
          },
        ])
        
        // Buscar status atualizado da Evolution API
        console.log(`🔄 Buscando status atualizado da Evolution API para: ${name}`)
        const statusResp = await whatsappService.getInstanceStatus(name)
        if (mounted && statusResp.success && statusResp.data?.instance) {
          console.log(`✅ Status atualizado recebido:`, statusResp.data.instance)
          const evoInstance = statusResp.data.instance
          
          // Mapear status da Evolution API para nosso formato
          let mappedStatus: string = record.status || 'CREATED'
          const rawState = evoInstance.instance?.state || evoInstance.state || evoInstance.instance?.status || evoInstance.status
          
          if (rawState && typeof rawState === 'string') {
            // Normalizar estados da Evolution API
            const stateLower = rawState.toLowerCase()
            if (stateLower === 'open' || stateLower === 'connected') {
              mappedStatus = 'open'
            } else if (stateLower === 'close' || stateLower === 'closed' || stateLower === 'disconnected') {
              mappedStatus = 'close'
            } else if (stateLower === 'connecting') {
              mappedStatus = 'connecting'
            } else {
              mappedStatus = rawState
            }
          }
          
          console.log(`🔄 Status mapeado: ${rawState} → ${mappedStatus}`)
          
          // Atualizar status com informações da Evolution API
          setInstances(prev => prev.map(inst => 
            inst.instance.instanceName === name 
              ? { 
                  ...inst, 
                  instance: { 
                    ...inst.instance, 
                    status: mappedStatus,
                    owner: evoInstance.instance?.owner || evoInstance.owner || inst.instance.owner,
                    profileName: evoInstance.instance?.profileName || evoInstance.profileName || inst.instance.profileName,
                    profilePictureUrl: evoInstance.instance?.profilePicUrl || evoInstance.profilePicUrl || inst.instance.profilePictureUrl,
                  } 
                }
              : inst
          ))
        }
        
        // Só mostrar QR Code se não estiver conectado
        if (!isConnected && record.qrcode) {
          setQrCodeData({
            [name]: { base64: record.qrcode },
          })
          // Iniciar refresh se não estiver conectado (usar ref)
          if (startQRCodeRefreshRef.current) {
            startQRCodeRefreshRef.current(name)
          }
        }
      } else {
        setHasExistingInstance(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  // Conectar instância (gerar QR Code)
  const handleConnectInstance = async (instanceName: string) => {
    try {
      setLoadingQR(instanceName)
      
      console.log('🔄 Conectando instância:', instanceName)
      
      const response = await whatsappService.connectWhatsAppInstance(instanceName)
      
      console.log('✅ Resposta completa da conexão:', JSON.stringify(response, null, 2))
      console.log('✅ response.success:', response.success)
      console.log('✅ response.data:', response.data)
      console.log('✅ response.data?.qrcode:', response.data?.qrcode)
      console.log('✅ Tipo do qrcode:', typeof response.data?.qrcode)
      
      if (response.success) {
        const qrcode = response.data?.qrcode
        
        console.log('🔍 QR Code extraído:', qrcode ? 'ENCONTRADO' : 'NÃO ENCONTRADO')
        
        if (qrcode) {
          console.log('🔍 Tipo do QR Code:', typeof qrcode)
          console.log('🔍 QR Code value (primeiros 100 chars):', 
            typeof qrcode === 'string' ? qrcode.substring(0, 100) : JSON.stringify(qrcode).substring(0, 100)
          )
          
          const success = processAndStoreQRCode(instanceName, qrcode)
          
          if (success) {
            // Iniciar refresh automático
            startQRCodeRefresh(instanceName)
            alert('QR Code gerado com sucesso! Escaneie com seu WhatsApp. O QR Code será atualizado automaticamente.')
          } else {
            console.error('❌ QR Code não encontrado na resposta:', response)
            alert('QR Code não foi gerado. Verifique se a instância está criada corretamente.')
          }
        } else {
          console.error('❌ QR Code não encontrado na resposta:', response)
          alert('QR Code não foi retornado. Tente novamente ou verifique o status da instância.')
        }
      } else {
        const errorMsg = response.error || 'Erro desconhecido ao gerar QR Code'
        console.error('❌ Erro ao gerar QR Code:', errorMsg)
        alert(`Erro ao gerar QR Code: ${errorMsg}`)
      }
    } catch (error) {
      console.error('❌ Erro ao conectar instância:', error)
      alert(`Erro ao conectar instância: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    } finally {
      setLoadingQR(null)
    }
  }


  // Desconectar instância
  const handleLogout = async (instanceName: string) => {
    if (!confirm('Deseja desconectar esta instância?')) return

    try {
      setSaving(true)
      
      console.log('🔄 Desconectando instância:', instanceName)
      
      const response = await whatsappService.logoutWhatsAppInstance(instanceName)
      
      console.log('✅ Resposta do logout:', response)
      
      if (response.success) {
        alert('Instância desconectada com sucesso!')
        setInstances(prev => prev.filter(inst => inst.instance.instanceName !== instanceName))
        setQrCodeData(prev => {
          const newData = { ...prev }
          delete newData[instanceName]
          return newData
        })
      } else {
        alert(`Erro ao desconectar: ${response.error}`)
      }
    } catch (error) {
      console.error('❌ Erro ao desconectar:', error)
      alert('Erro ao desconectar')
    } finally {
      setSaving(false)
    }
  }

  // Deletar instância
  const handleDelete = async (instanceName: string) => {
    if (!confirm('Tem certeza que deseja deletar esta instância? Esta ação não pode ser desfeita.')) return

    try {
      setSaving(true)
      
      console.log('🔄 Deletando instância:', instanceName)
      
      const response = await whatsappService.deleteWhatsAppInstance(instanceName)
      
      console.log('✅ Resposta da deleção:', response)
      
      if (response.success) {
        alert('Instância deletada com sucesso!')
        setInstances(prev => prev.filter(inst => inst.instance.instanceName !== instanceName))
        setQrCodeData(prev => {
          const newData = { ...prev }
          delete newData[instanceName]
          return newData
        })
      } else {
        alert(`Erro ao deletar: ${response.error}`)
      }
    } catch (error) {
      console.error('❌ Erro ao deletar:', error)
      alert('Erro ao deletar')
    } finally {
      setSaving(false)
    }
  }

  // Cancelar QR Code
  const handleCancelQRCode = (instanceName: string) => {
    // Parar refresh automático
    stopQRCodeRefresh(instanceName)
    
    // Remover QR Code
    setQrCodeData(prev => {
      const newData = { ...prev }
      delete newData[instanceName]
      return newData
    })
  }

  // Regenerar QR Code
  const handleRegenerateQRCode = async (instanceName: string) => {
    try {
      setLoadingQR(instanceName)
      
      console.log('🔄 Regenerando QR code para instância:', instanceName)
      
      const response = await whatsappService.regenerateQRCode(instanceName)
      
      console.log('✅ Resposta da regeneração:', JSON.stringify(response, null, 2))
      
      if (response.success) {
        const qrcode = response.data?.qrcode
        
        if (qrcode) {
          const success = processAndStoreQRCode(instanceName, qrcode)
          
          if (success) {
            // Reiniciar refresh automático
            startQRCodeRefresh(instanceName)
            alert('✅ Novo QR code gerado com sucesso! O QR code será atualizado automaticamente na tela.')
          } else {
            console.error('❌ QR code não encontrado na resposta:', response)
            alert('QR code não foi gerado corretamente.')
          }
        } else {
          console.error('❌ QR code não encontrado na resposta:', response)
          alert('QR code não foi retornado. Tente novamente.')
        }
      } else {
        const errorMsg = response.error || 'Erro desconhecido ao gerar novo QR code'
        console.error('❌ Erro ao regenerar QR code:', errorMsg)
        alert(`Erro ao gerar novo QR code: ${errorMsg}`)
      }
    } catch (error) {
      console.error('❌ Erro ao regenerar QR code:', error)
      alert(`Erro ao regenerar QR code: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    } finally {
      setLoadingQR(null)
    }
  }

  // Limpar timers quando componente desmontar ou instância mudar
  React.useEffect(() => {
    return () => {
      // Limpar todos os timers quando componente desmontar
      Object.values(qrCodeRefreshTimers).forEach(timer => clearInterval(timer))
    }
  }, [qrCodeRefreshTimers])

  // Monitorar mudanças de status das instâncias para parar refresh quando conectado
  React.useEffect(() => {
    instances.forEach(instanceData => {
      const instance = instanceData.instance
      if (instance.status === 'open' && qrCodeData[instance.instanceName]) {
        // Instância conectada, parar refresh e remover QR Code
        console.log(`🔄 Removendo QR Code da instância conectada: ${instance.instanceName}`)
        stopQRCodeRefresh(instance.instanceName)
        setQrCodeData(prev => {
          const newData = { ...prev }
          delete newData[instance.instanceName]
          return newData
        })
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instances])



  // Get status badge com mais detalhes
  const getStatusBadge = (status?: string) => {
    if (status === 'open' || status === 'CONNECTED') {
      return (
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm font-medium">Conectado</span>
        </div>
      )
    }
    
    if (status === 'connecting' || status === 'CONNECTING') {
      return (
        <div className="flex items-center gap-2 text-blue-600">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm font-medium">Conectando...</span>
        </div>
      )
    }
    
    if (status === 'close' || status === 'CLOSED' || status === 'DISCONNECTED') {
      return (
        <div className="flex items-center gap-2 text-gray-600">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm font-medium">Desconectado</span>
        </div>
      )
    }
    
    if (status === 'QRCODE_GENERATED' || status === 'CREATED' || status === 'qrcode') {
      return (
        <div className="flex items-center gap-2 text-amber-600">
          <QrCode className="w-4 h-4" />
          <span className="text-sm font-medium">Aguardando QR Code</span>
        </div>
      )
    }
    
    return (
      <div className="flex items-center gap-2 text-gray-600">
        <AlertCircle className="w-4 h-4" />
        <span className="text-sm font-medium">Status: {status || 'Desconhecido'}</span>
      </div>
    )
  }

  // Função para obter mensagem detalhada do status
  const getStatusMessage = (status?: string, hasQRCode?: boolean) => {
    if (status === 'open' || status === 'CONNECTED') {
      return 'WhatsApp está conectado e funcionando'
    }
    
    if (status === 'connecting' || status === 'CONNECTING') {
      return 'Aguardando conexão do WhatsApp'
    }
    
    if (status === 'QRCODE_GENERATED' || hasQRCode) {
      return 'QR Code gerado! Escaneie com seu WhatsApp para conectar'
    }
    
    if (status === 'CREATED' || !status) {
      return 'Instância criada. Clique em "Conectar" para gerar o QR Code'
    }
    
    if (status === 'close' || status === 'CLOSED' || status === 'DISCONNECTED') {
      return 'WhatsApp não está conectado. Gere um novo QR Code para conectar'
    }
    
    return `Status atual: ${status || 'Desconhecido'}`
  }

  return (
    <AuthGuard orgSlug={org}>
      <SidebarProvider>
        <AppSidebar org={org} />
        <SidebarInset>
          {/* HEADER */}
          <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href={`/${org}/dashboard`}>
                    Dashboard
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbLink href={`/${org}/settings`}>
                    Configurações
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>WhatsApp (Evolution API)</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>

          {/* MAIN CONTENT */}
          <div className="flex-1 space-y-4 p-4 pt-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-3xl font-bold tracking-tight">Configuração do WhatsApp</h2>
                  {/* Indicador de conexão WebSocket */}
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isWebSocketConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                    <span className="text-xs text-muted-foreground">
                      {isWebSocketConnected ? 'Em tempo real' : 'Offline'}
                    </span>
                  </div>
                </div>
                <p className="text-muted-foreground">
                  Configure sua integração com WhatsApp usando Evolution API
                </p>
              </div>
              <Button 
                onClick={() => setShowForm(!showForm)} 
                disabled={hasExistingInstance}
              >
                {showForm ? 'Cancelar' : 'Nova Instância'}
              </Button>
            </div>

            <div className="grid gap-6">
              {/* Formulário para nova instância */}
              {showForm && !hasExistingInstance && (
                <Card>
                  <CardHeader>
                    <CardTitle>Nova Instância Evolution API</CardTitle>
                    <CardDescription>
                      Crie uma nova instância do WhatsApp
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="instanceName">Nome da Instância</Label>
                      <Input
                        id="instanceName"
                        placeholder="ex: minha_empresa"
                        value={instanceName}
                        onChange={(e) => setInstanceName(e.target.value)}
                        className="font-mono"
                      />
                      <p className="text-sm text-muted-foreground">
                        Use apenas letras minúsculas, números e underline (_)
                      </p>
                    </div>
                    
                    <Button 
                      onClick={handleCreateInstance} 
                      disabled={saving || !instanceName.trim() || hasExistingInstance}
                      className="w-full"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Criando...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Criar Instância
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Lista de instâncias */}
              {instances.length === 0 && !showForm ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <MessageSquare className="w-12 h-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhuma instância configurada</h3>
                    <p className="text-muted-foreground mb-4">
                      Clique em &quot;Nova Instância&quot; para começar
                    </p>
                  </CardContent>
                </Card>
              ) : (
                instances.map((instanceData) => {
                  const instance = instanceData.instance
                  return (
                    <Card key={instance.instanceName}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle className="flex items-center gap-2">
                              {instance.profileName || instance.instanceName}
                              {getStatusBadge(instance.status)}
                            </CardTitle>
                            <CardDescription className="flex items-center gap-4 flex-wrap">
                              <span>Instância: {instance.instanceName}</span>
                            </CardDescription>
                          </div>
                          <div className="flex gap-2">
                            {instance.status === 'open' ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleLogout(instance.instanceName)}
                                disabled={saving}
                              >
                                <LogOut className="w-4 h-4 mr-2" />
                                Desconectar
                              </Button>
                            ) : (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleConnectInstance(instance.instanceName)}
                                disabled={loadingQR === instance.instanceName}
                              >
                                {loadingQR === instance.instanceName ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Carregando...
                                  </>
                                ) : (
                                  <>
                                    <QrCode className="w-4 h-4 mr-2" />
                                    Conectar
                                  </>
                                )}
                              </Button>
                            )}
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(instance.instanceName)}
                              disabled={saving}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {instance.owner && (
                          <div>
                            <strong>Número:</strong> {instance.owner}
                          </div>
                        )}
                        
                        {/* Card de Status da Conexão */}
                        <div className="border rounded-lg p-4 bg-gradient-to-br from-gray-50 to-white">
                          <div className="flex items-center gap-3">
                            {getStatusBadge(instance.status)}
                            <p className="text-sm text-gray-600">
                              {getStatusMessage(instance.status, !!qrCodeData[instance.instanceName])}
                            </p>
                          </div>
                        </div>

                        
                        {/* QR Code */}
                        {instance.status !== 'open' && (
                          <div className="border rounded-lg p-6">
                            {qrCodeData[instance.instanceName] && (
                              <>
                                <div className="flex justify-center mb-4">
                                  <div className="relative">
                                    {qrCodeData[instance.instanceName].base64 && (
                                      <Image
                                        src={qrCodeData[instance.instanceName].base64!}
                                        alt="QR Code WhatsApp"
                                        width={280}
                                        height={280}
                                        className="border-4 border-white rounded-lg shadow-lg"
                                      />
                                    )}
                                  </div>
                                </div>
                                
                                {qrCodeData[instance.instanceName].pairingCode && (
                                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                    <p className="text-sm font-medium text-gray-900 mb-2">
                                      Código de pareamento:
                                    </p>
                                    <p className="text-xl font-mono font-bold text-center text-blue-600">
                                      {qrCodeData[instance.instanceName].pairingCode}
                                    </p>
                                  </div>
                                )}
                              </>
                            )}
                            
                            {!qrCodeData[instance.instanceName] && (
                              <div className="text-center py-8 text-gray-500">
                                <QrCode className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                                <p className="text-sm">Nenhum QR Code gerado ainda</p>
                              </div>
                            )}
                            
                            <div className="flex gap-2 mt-4">
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleRegenerateQRCode(instance.instanceName)}
                                disabled={loadingQR === instance.instanceName}
                                className="flex-1"
                              >
                                {loadingQR === instance.instanceName ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Gerando...
                                  </>
                                ) : (
                                  <>
                                    <QrCode className="w-4 h-4 mr-2" />
                                    {qrCodeData[instance.instanceName] ? 'Gerar Novo QR Code' : 'Gerar QR Code'}
                                  </>
                                )}
                              </Button>
                              {qrCodeData[instance.instanceName] && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCancelQRCode(instance.instanceName)}
                                  className="flex-1"
                                >
                                  ✕ Cancelar QR Code
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  )
}
