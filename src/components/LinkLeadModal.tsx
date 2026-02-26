'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { Search, User, Mail, Phone, Loader2 } from 'lucide-react';
import { apiService, Lead } from '@/services/LeadService';

interface LinkLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLink: (leadId: string) => Promise<void>;
  onUnlink?: () => Promise<void>;
  onCreateNew?: () => void;
  conversationName?: string;
  currentLinkedLead?: Lead | null;
}

export function LinkLeadModal({ isOpen, onClose, onLink, onUnlink, onCreateNew, conversationName, currentLinkedLead }: LinkLeadModalProps) {
  const t = useTranslations('TelegramChats.linkLeadModal')
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Lead[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionMode, setActionMode] = useState<'link' | 'unlink' | 'change'>('link');
  // Mode to show just details if a lead is linked (and NOT showing the search options etc)
  const [showLeadDetailsOnly, setShowLeadDetailsOnly] = useState(!!currentLinkedLead);
  const [linkedLeadIds, setLinkedLeadIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setShowLeadDetailsOnly(!!currentLinkedLead);
  }, [currentLinkedLead]);

  // Load all leads that are already linked to conversations
  {/* useEffect(() => {
    const loadLinkedLeadIds = async () => {
      try {
        // Get all telegram conversations
        const conversationsResponse = await apiService.({ limit: 1000 });
        
        if (conversationsResponse.success && conversationsResponse.data?.conversations) {
          // Extract unique lead IDs that are already linked
          const linkedIds = new Set<string>();
          conversationsResponse.data.conversations.forEach((conv: any) => {
            if (conv.lead_id) {
              linkedIds.add(conv.lead_id);
            }
          });
          
          // If we're in change mode and there's a current linked lead, exclude it from the set
          // so it can still be selected
          if (actionMode === 'change' && currentLinkedLead?.id) {
            linkedIds.delete(currentLinkedLead.id);
          }
          
          setLinkedLeadIds(linkedIds);
        }
      } catch (err) {
        console.error('Error loading linked lead IDs:', err);
      }
    };

    if (isOpen) {
      loadLinkedLeadIds();
    }
  }, [isOpen, actionMode, currentLinkedLead]); */}

  // Search leads when query changes (with debounce)
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      setError(null);

      try {
        // Search by multiple fields, or get all leads if query is empty
        const response = await apiService.searchLeads({
          search: searchQuery.trim() || undefined,
          limit: 10
        });

        if (response.success && response.data) {
          // Filter out leads that are already linked to conversations
          const filteredLeads = (response.data.leads || []).filter(
            (lead: Lead) => !linkedLeadIds.has(lead.id)
          );
          setSearchResults(filteredLeads);
        } else {
          setError(response.error || t('errors.searchFailed'));
          setSearchResults([]);
        }
      } catch (err) {
        console.error('Search error:', err);
        setError(t('errors.searchGeneric'));
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, searchQuery.trim() ? 500 : 0); // No debounce when query is empty

    return () => clearTimeout(timeoutId);
  }, [searchQuery, linkedLeadIds]);

  const handleLink = async () => {
    if (!selectedLead) return;

    setIsLinking(true);
    setError(null);

    try {
      await onLink(selectedLead.id);
      onClose();
      // Reset state
      setSearchQuery('');
      setSearchResults([]);
      setSelectedLead(null);
    } catch (err) {
      console.error('Link error:', err);
      setError(t('errors.linkFailed'));
    } finally {
      setIsLinking(false);
    }
  };

  const handleUnlinkAndShowSearch = async () => {
    if (!onUnlink) return;
    setIsUnlinking(true);
    setError(null);
    try {
      await onUnlink();
      // Don't close the modal — instead, show the search UI.
      setShowLeadDetailsOnly(false);
      setSearchQuery('');
      setSearchResults([]);
      setSelectedLead(null);
    } catch (err) {
      console.error('Unlink error:', err);
      setError(t('errors.unlinkFailed'));
    } finally {
      setIsUnlinking(false);
    }
  };

  const handleClose = () => {
    if (!isLinking && !isUnlinking) {
      setSearchQuery('');
      setSearchResults([]);
      setSelectedLead(null);
      setError(null);
      onClose();
    }
  };

  const displayConversationName = conversationName && conversationName.length > 32
    ? `${conversationName.slice(0, 32)}…`
    : conversationName

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="leading-tight break-words">
            {(showLeadDetailsOnly && currentLinkedLead)
              ? t('titles.change')
              : (actionMode === 'unlink' && t('titles.unlink')) ||
                (actionMode === 'change' && t('titles.change')) ||
                (actionMode === 'link' && (displayConversationName ? t('titles.linkWithName', { name: displayConversationName }) : t('titles.link')))
            }
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Show only the linked lead details and unlink button if showLeadDetailsOnly is true */}
          {showLeadDetailsOnly && currentLinkedLead ? (
            <>
              <div className="border rounded-md p-4 bg-blue-50 border-blue-200">
                <div className="text-sm font-medium mb-2 text-blue-800">{t('currentlyLinked')}</div>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{currentLinkedLead.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground break-all">
                    <Mail className="h-3 w-3" />
                    <span>{currentLinkedLead.email}</span>
                  </div>
                  {currentLinkedLead.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground break-all">
                      <Phone className="h-3 w-3" />
                      <span>{currentLinkedLead.phone}</span>
                    </div>
                  )}
                </div>
              </div>
              {/* Only the unlink button at bottom */}
              <DialogFooter>
                <div className="flex justify-end">
                  <Button
                    variant="destructive"
                    onClick={handleUnlinkAndShowSearch}
                    disabled={isUnlinking}
                    className="cursor-pointer whitespace-normal text-center"
                  >
                    {isUnlinking ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('actions.unlinking')}</>) : t('actions.unlink')}
                  </Button>
                </div>
              </DialogFooter>
            </>
          ) : (
            // Standard link/selection UI
            <>
              {/* Current Linked Lead Info */}
              {currentLinkedLead && actionMode === 'change' && (
                <div className="border rounded-md p-4 bg-blue-50 border-blue-200">
                  <div className="text-sm font-medium mb-2 text-blue-800">{t('currentlyLinked')}</div>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{currentLinkedLead.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground break-all">
                      <Mail className="h-3 w-3" />
                      <span>{currentLinkedLead.email}</span>
                    </div>
                    {currentLinkedLead.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground break-all">
                        <Phone className="h-3 w-3" />
                        <span>{currentLinkedLead.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Search Input */}
              <div className="space-y-2">
                <Label htmlFor="search">{t('search.label')}</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    type="text"
                    placeholder={t('search.placeholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    disabled={isLinking}
                  />
                  {isSearching && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-md text-sm">
                  {error}
                </div>
              )}

              {/* Search Results */}
              <div className="space-y-2">
                {searchResults.length > 0 ? (
                  <div className="space-y-1 max-h-[300px] overflow-y-auto border rounded-md">
                    {searchResults.map((lead) => (
                      <button
                        key={lead.id}
                        onClick={() => setSelectedLead(lead)}
                        disabled={isLinking}
                        className={`w-full text-left px-4 py-3 hover:bg-accent transition-colors cursor-pointer ${
                          selectedLead?.id === lead.id ? 'bg-accent border-2 border-primary' : 'border-2 border-transparent'
                        } disabled:opacity-50 disabled:cursor-not-allowed rounded-md`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{lead.name}</span>
                            {lead.status && (
                              <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                {lead.status}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            <span>{lead.email}</span>
                          </div>
                          {lead.phone && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              <span>{lead.phone}</span>
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : !isSearching ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchQuery.trim() 
                      ? t('search.noResultsWithQuery', { query: searchQuery })
                      : t('search.noResults')
                    }
                  </div>
                ) : null}
              </div>

              {/* Action Buttons */}
              <DialogFooter>
                <div className="flex w-full justify-between gap-2 flex-wrap">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      if (onCreateNew) {
                        onCreateNew()
                      }
                    }}
                    disabled={isLinking || isUnlinking}
                    className="cursor-pointer whitespace-normal text-center"
                  >
                    {t('actions.createNew')}
                  </Button>
                  
                  <div className="flex gap-2 flex-wrap justify-end">
                    <Button 
                      variant="outline" 
                      onClick={handleClose} 
                      disabled={isLinking || isUnlinking}
                      className="cursor-pointer whitespace-normal text-center"
                    >
                      {t('actions.cancel')}
                    </Button>
                    
                    {actionMode === 'change' && currentLinkedLead && (
                      <Button 
                        variant="destructive" 
                        onClick={handleUnlinkAndShowSearch} 
                        disabled={isLinking || isUnlinking}
                        className="cursor-pointer whitespace-normal text-center"
                      >
                        {isUnlinking ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {t('actions.unlinking')}
                          </>
                        ) : (
                          t('actions.unlink')
                        )}
                      </Button>
                    )}
                    
                    {(actionMode === 'link' || actionMode === 'change') && (
                      <Button 
                        onClick={handleLink} 
                        disabled={!selectedLead || isLinking || isUnlinking}
                        className="cursor-pointer whitespace-normal text-center"
                      >
                        {isLinking ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {actionMode === 'change' ? t('actions.changing') : t('actions.linking')}
                          </>
                        ) : (
                          actionMode === 'change' ? t('actions.changeToSelected') : t('actions.link')
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </DialogFooter>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}


