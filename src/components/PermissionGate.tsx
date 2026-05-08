'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

type PermissionType = 'view' | 'create' | 'edit' | 'delete' | 'export';
type ModuleType = 'financeiro' | 'contabilidade' | 'fiscal' | 'relatorios' | 'estoque' | 'rh';

interface PermissionGateProps {
  requiredPermission?: PermissionType;
  module?: ModuleType;
  fallback?: React.ReactNode;
  children: React.ReactNode;
  action?: 'hide' | 'disable'; // hide = ocultar, disable = desabilitar botão
}

interface UserPermissions {
  financeiro: PermissionType[];
  contabilidade: PermissionType[];
  fiscal: PermissionType[];
  relatorios: PermissionType[];
  estoque: PermissionType[];
  rh: PermissionType[];
}

// Mapa de permissões baseado em role
const ROLE_PERMISSIONS: Record<string, UserPermissions> = {
  admin: {
    financeiro: ['view', 'create', 'edit', 'delete', 'export'],
    contabilidade: ['view', 'create', 'edit', 'delete', 'export'],
    fiscal: ['view', 'create', 'edit', 'delete', 'export'],
    relatorios: ['view', 'export'],
    estoque: ['view', 'create', 'edit', 'delete', 'export'],
    rh: ['view', 'create', 'edit', 'delete', 'export'],
  },
  financeiro: {
    financeiro: ['view', 'create', 'edit', 'delete', 'export'],
    contabilidade: ['view'], // Pode visualizar para reconciliação
    fiscal: ['view'],
    relatorios: ['view', 'export'],
    estoque: [],
    rh: [],
  },
  contador: {
    financeiro: ['view', 'create', 'edit', 'export'],
    contabilidade: ['view', 'create', 'edit', 'delete', 'export'],
    fiscal: ['view', 'create', 'edit', 'export'],
    relatorios: ['view', 'export'],
    estoque: ['view'],
    rh: [],
  },
  auditor: {
    financeiro: ['view', 'export'],
    contabilidade: ['view', 'export'],
    fiscal: ['view', 'export'],
    relatorios: ['view', 'export'],
    estoque: ['view', 'export'],
    rh: ['view', 'export'],
  },
  gerente: {
    financeiro: ['view', 'export'],
    contabilidade: ['view', 'export'],
    fiscal: ['view'],
    relatorios: ['view', 'export'],
    estoque: ['view', 'export'],
    rh: ['view', 'export'],
  },
  employee: {
    financeiro: ['view'],
    contabilidade: [],
    fiscal: [],
    relatorios: [],
    estoque: ['view'],
    rh: [],
  },
};

export default function PermissionGate({
  requiredPermission = 'view',
  module = 'financeiro',
  fallback,
  children,
  action = 'hide',
}: PermissionGateProps) {
  const { user } = useAuth();
  const userRole = user?.role || 'employee';
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      if (!userRole) {
        setIsAuthorized(false);
        setIsLoading(false);
        return;
      }

      // Obter permissões do role
      const permissions = ROLE_PERMISSIONS[userRole] || {};
      const modulePermissions = permissions[module] || [];

      // Verificar se tem a permissão requerida
      const hasPermission = modulePermissions.includes(requiredPermission);
      setIsAuthorized(hasPermission);
    } catch (error) {
      console.error('Erro ao verificar permissão:', error);
      setIsAuthorized(false);
    } finally {
      setIsLoading(false);
    }
  }, [userRole, requiredPermission, module]);

  if (isLoading) {
    return <>{children}</>;
  }

  if (!isAuthorized) {
    if (action === 'hide') {
      return fallback ? <>{fallback}</> : null;
    }

    // action === 'disable'
    // Renderizar children mas desabilitar interações
    if (React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        disabled: true,
        title: `Você não tem permissão para ${requiredPermission} neste módulo`,
      });
    }

    return (
      <div
        title={`Você não tem permissão para ${requiredPermission} neste módulo`}
        className="opacity-50 cursor-not-allowed"
      >
        {children}
      </div>
    );
  }

  return <>{children}</>;
}
