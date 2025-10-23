'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiService, Lead } from '@/lib/api';
import { Search, User, Mail, Phone, Loader2 } from 'lucide-react';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Lead[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionMode, setActionMode] = useState<'link' | 'unlink' | 'change'>('link');

  // Set action mode based on current linked lead
  useEffect(() => {
    if (currentLinkedLead) {
      setActionMode('change');
    } else {
      setActionMode('link');
    }
  }, [currentLinkedLead]);

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
          setSearchResults(response.data.leads || []);
        } else {
          setError(response.error || 'Failed to search leads');
          setSearchResults([]);
        }
      } catch (err) {
        console.error('Search error:', err);
        setError('An error occurred while searching');
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, searchQuery.trim() ? 500 : 0); // No debounce when query is empty

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

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
      setError('Failed to link conversation to lead');
    } finally {
      setIsLinking(false);
    }
  };

  const handleUnlink = async () => {
    if (!onUnlink) return;

    setIsUnlinking(true);
    setError(null);

    try {
      await onUnlink();
      onClose();
      // Reset state
      setSearchQuery('');
      setSearchResults([]);
      setSelectedLead(null);
    } catch (err) {
      console.error('Unlink error:', err);
      setError('Failed to unlink conversation from lead');
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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {actionMode === 'unlink' && 'Unlink Lead'}
            {actionMode === 'change' && 'Change Linked Lead'}
            {actionMode === 'link' && `Link ${conversationName ? `"${conversationName}"` : 'Conversation'} to Lead`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Linked Lead Info */}
          {currentLinkedLead && actionMode === 'change' && (
            <div className="border rounded-md p-4 bg-blue-50 border-blue-200">
              <div className="text-sm font-medium mb-2 text-blue-800">Currently Linked Lead:</div>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{currentLinkedLead.name}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-3 w-3" />
                  <span>{currentLinkedLead.email}</span>
                </div>
                {currentLinkedLead.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    <span>{currentLinkedLead.phone}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Search Input */}
          <div className="space-y-2">
            <Label htmlFor="search">Search by Name, Email, or Phone</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                type="text"
                placeholder="Type to search leads..."
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
                  ? `No leads found matching "${searchQuery}"`
                  : 'No leads available'
                }
              </div>
            ) : null}
          </div>

        </div>

        <DialogFooter>
        <div className="flex w-full justify-between">
          <Button 
            variant="outline" 
            onClick={() => {
              if (onCreateNew) {
                onCreateNew()
              }
            }}
            disabled={isLinking || isUnlinking}
            className="cursor-pointer"
          >
            Create New Lead
          </Button>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleClose} 
              disabled={isLinking || isUnlinking}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            
            {actionMode === 'change' && currentLinkedLead && (
              <Button 
                variant="destructive" 
                onClick={handleUnlink} 
                disabled={isLinking || isUnlinking}
                className="cursor-pointer"
              >
                {isUnlinking ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Unlinking...
                  </>
                ) : (
                  'Unlink Lead'
                )}
              </Button>
            )}
            
            {(actionMode === 'link' || actionMode === 'change') && (
              <Button 
                onClick={handleLink} 
                disabled={!selectedLead || isLinking || isUnlinking}
                className="cursor-pointer"
              >
                {isLinking ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {actionMode === 'change' ? 'Changing...' : 'Linking...'}
                  </>
                ) : (
                  actionMode === 'change' ? 'Change to Selected Lead' : 'Link to Lead'
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


