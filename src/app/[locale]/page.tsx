

'use client';

import * as React from 'react';
import { Link, useRouter } from '@/lib/navigation';
import Image from 'next/image';
import { ShoppingCart, Trash2, Plus, Minus, Search, ArrowRight, Loader2, User, History, Settings, LogOut, Moon, Sun, LifeBuoy, ListChecks, Edit, Save, X, ListPlus, MessageSquare, Languages, MapPin } from 'lucide-react';
import AuthWrapper from '@/components/auth/AuthWrapper';
import BudgetTracker from '@/components/budget/BudgetTracker';
import BarcodeScanner from '@/components/scanner/BarcodeScanner';
import { useCart } from '@/hooks/use-cart';
import type { Product, ShoppingListItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import AISavingsFinder from '@/components/cart/AISavingsFinder';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import SpendIQLogo from '@/components/SpendIQLogo';
import { Card, CardContent } from '@/components/ui/card';
import { BudgetExceededDialog } from '@/components/budget/BudgetExceededDialog';
import { getValidImageUrl } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTheme } from 'next-themes';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useShoppingList } from '@/hooks/use-shopping-list';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { VoiceInput } from '@/app/[locale]/list/VoiceInput';
import { FeedbackDialog } from '@/components/feedback/FeedbackDialog';
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import BottomNav from '@/components/layout/BottomNav';
import { useUIStore } from '@/hooks/use-ui-store';
import { StoreSwitcher } from '@/components/store/StoreSwitcher';


function TodaysList() {
  const t = useTranslations('HomePage');
  const { todayList, toggleItemChecked, deleteItem, updateItemName, addManualItem, clearTodayList } = useShoppingList();
  const { toast } = useToast();
  const [editingItemId, setEditingItemId] = React.useState<string | null>(null);
  const [editingItemName, setEditingItemName] = React.useState('');
  const [manualItem, setManualItem] = React.useState('');

  const handleEditClick = (item: ShoppingListItem) => {
    setEditingItemId(item.id);
    setEditingItemName(item.name);
  };

  const handleSaveEdit = (itemId: string) => {
    if (editingItemName.trim()) {
      updateItemName(itemId, editingItemName.trim());
      setEditingItemId(null);
      setEditingItemName('');
    }
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
    setEditingItemName('');
  };
  
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualItem.trim()) {
        addManualItem(manualItem.trim());
        setManualItem('');
    }
  }

  const handleVoiceItemAdded = (item: string) => {
    if (item.trim()) {
        addManualItem(item.trim());
        toast({
            title: t('itemAdded'),
            description: t('itemAddedToCart', { itemName: item })
        })
    }
  }

  const handleClearList = () => {
    clearTodayList();
    toast({
      title: t('listCleared'),
      description: t('listClearedDescription')
    });
  }

  return (
     <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">{t('addToList')}</h3>
        <AlertDialog>
          <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" disabled={todayList.length === 0}>
                  <Trash2 className="mr-2 h-4 w-4"/>
                  {t('clearAll')}
              </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>{t('areYouSure')}</AlertDialogTitle>
                  <AlertDialogDescription>
                      {t('confirmClearList')}
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearList}>{t('clearList')}</AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="space-y-2 mb-4">
          <div className="flex gap-2">
              <form onSubmit={handleAddItem} className="flex-grow flex gap-2">
                  <Input 
                      value={manualItem}
                      onChange={(e) => setManualItem(e.target.value)}
                      placeholder={t('typeAnItem')}
                  />
                  <Button type="submit" variant="outline">{t('add')}</Button>
              </form>
              <VoiceInput onItemAdded={handleVoiceItemAdded} />
          </div>
      </div>
      <ScrollArea className="flex-grow h-32">
          {todayList.length === 0 ? (
            <div className="text-center text-muted-foreground py-10">
              <ListPlus className="mx-auto h-8 w-8 mb-2"/>
              <p>{t('listIsEmpty')}</p>
              <p>{t('addItemsOrGoToListTab')}</p>
            </div>
          ) : (
            <div className="space-y-1 pr-4">
              {todayList.map((item, index) => (
                <React.Fragment key={item.id}>
                  <div className="flex items-center space-x-3 py-1 text-sm">
                    <Checkbox
                      id={`cart-list-${item.id}`}
                      checked={item.checked}
                      onCheckedChange={() => toggleItemChecked(item.id)}
                      disabled={!!editingItemId}
                    />
                    {editingItemId === item.id ? (
                      <Input
                        value={editingItemName}
                        onChange={(e) => setEditingItemName(e.target.value)}
                        className="h-8 flex-grow"
                        autoFocus
                      />
                    ) : (
                      <Label
                        htmlFor={`cart-list-${item.id}`}
                        className={cn("flex-grow", item.checked && "line-through text-muted-foreground")}
                      >
                        <span className="font-semibold text-primary mr-2">{index + 1}.</span>
                        {item.name}
                      </Label>
                    )}
                    <div className="flex items-center gap-1 ml-auto">
                      {editingItemId === item.id ? (
                        <>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleSaveEdit(item.id)}>
                            <Save className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCancelEdit}>
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditClick(item)} disabled={!!editingItemId}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteItem(item.id)} disabled={!!editingItemId}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  {index < todayList.length - 1 && <Separator />}
                </React.Fragment>
              ))}
            </div>
          )}
        </ScrollArea>
     </div>
  )
}


function SpendWiseDashboard() {
  const router = useRouter();
  const t = useTranslations('HomePage');
  const { toast } = useToast();
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { isCameraActive } = useUIStore();
  const {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    totalItems,
    totalPrice,
    isBudgetSet,
    setBudget,
    isHydrated,
  } = useCart();
  const { syncWithCart } = useShoppingList();
  
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isBudgetDialogOpen, setIsBudgetDialogOpen] = React.useState(false);
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = React.useState(false);
  const [initialBudget, setInitialBudget] = React.useState('');
  
  React.useEffect(() => {
    if (isHydrated && !isBudgetSet) {
      setIsBudgetDialogOpen(true);
    }
  }, [isBudgetSet, isHydrated]);

  React.useEffect(() => {
    if (cart.length > 0) {
      const cartItemNames = cart.map(item => item.name);
      syncWithCart(cartItemNames);
    }
  }, [cart, syncWithCart]);

  const handleSetInitialBudget = () => {
    const budgetValue = parseFloat(initialBudget);
    if (!isNaN(budgetValue) && budgetValue > 0) {
      setBudget(budgetValue, false);
      setIsBudgetDialogOpen(false);
      setInitialBudget('');
    } else {
       toast({
        title: t('invalidBudget'),
        description: t('enterValidNumber'),
        variant: 'destructive',
      });
    }
  };

  const handleProductScanned = (product: Product) => {
    addToCart(product);
  };

  const handleUpdateQuantity = (productId: string, change: number) => {
    updateQuantity(productId, change);
  };
  
  const filteredCart = cart.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    if (name.startsWith('+')) return name.slice(-2);
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = '/login'; // Use standard navigation for logout
  };
  
  const isDarkMode = theme === 'dark';

  const toggleTheme = () => {
    setTheme(isDarkMode ? 'light' : 'dark');
  };

  return (
    <>
    <div className={cn("flex flex-col min-h-screen bg-background font-body", !isCameraActive && "pb-20")}>
      <BudgetExceededDialog />
      <div className="w-full max-w-md mx-auto flex flex-col flex-grow p-4">
        <header className="flex items-center justify-between mb-4">
            <SpendIQLogo />
            <div className="flex items-center">
                 <Button
                    variant="ghost"
                    size="icon"
                    aria-label={t('reportIssue')}
                    onClick={() => setIsFeedbackDialogOpen(true)}
                    >
                    <MessageSquare className="h-6 w-6" />
                </Button>
                <StoreSwitcher />
                 <Sheet>
                    <SheetTrigger asChild>
                        <Button
                        variant="ghost"
                        size="icon"
                        aria-label={t('openSidebar')}
                        >
                        <Settings className="h-6 w-6" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="right">
                        <SheetHeader>
                            <SheetTitle>{t('accountAndSettings')}</SheetTitle>
                        </SheetHeader>
                        <div className="flex flex-col h-full pt-4">
                            <div className="p-6 pt-0 flex flex-col items-center space-y-2">
                                 <Avatar className="h-20 w-20">
                                    <AvatarImage src={user?.photoURL || undefined} alt={user?.displayName || 'User'} />
                                    <AvatarFallback>{getInitials(user?.displayName)}</AvatarFallback>
                                </Avatar>
                                <h2 className="text-xl font-semibold">{user?.displayName || t('welcome')}</h2>
                                <p className="text-sm text-muted-foreground">{user?.email || user?.phoneNumber}</p>
                            </div>
                            <Separator />
                            <nav className="flex-grow p-4 space-y-2">
                                 <Link href='/profile' passHref>
                                    <Button variant="ghost" className="w-full justify-start text-base"><User className="mr-3 h-5 w-5" /> {t('profile')}</Button>
                                 </Link>
                                 <Link href='/history' passHref>
                                    <Button variant="ghost" className="w-full justify-start text-base"><History className="mr-3 h-5 w-5" /> {t('purchaseHistory')}</Button>
                                 </Link>
                                 <Link href='/support' passHref>
                                    <Button variant="ghost" className="w-full justify-start text-base"><LifeBuoy className="mr-3 h-5 w-5" /> {t('helpAndSupport')}</Button>
                                  </Link>
                                  <div className="flex items-center justify-between rounded-lg p-3">
                                    <div className="flex items-center space-x-2">
                                        {isDarkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                                        <Label htmlFor="dark-mode-toggle" className="text-base font-normal">
                                            {t('darkMode')}
                                        </Label>
                                    </div>
                                    <Switch
                                        id="dark-mode-toggle"
                                        checked={isDarkMode}
                                        onCheckedChange={toggleTheme}
                                        aria-label="Toggle dark mode"
                                    />
                                </div>
                                <LanguageSwitcher />
                            </nav>
                             <Separator />
                            <div className="p-4">
                                 <Button variant="ghost" className="w-full justify-start text-base" onClick={handleLogout}><LogOut className="mr-3 h-5 w-5" /> {t('logout')}</Button>
                            </div>
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </header>
        
        <AlertDialog open={isBudgetDialogOpen} onOpenChange={setIsBudgetDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('welcomeToSpendWise')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('setShoppingBudget')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <Input
              type="number"
              placeholder={t('enterBudget')}
              value={initialBudget}
              onChange={(e) => setInitialBudget(e.target.value)}
              className="my-4"
            />
            <AlertDialogFooter>
              <AlertDialogAction onClick={handleSetInitialBudget}>{t('setBudget')}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        
        <FeedbackDialog isOpen={isFeedbackDialogOpen} onOpenChange={setIsFeedbackDialogOpen} />

        <div className="space-y-4 mb-4">
          <BudgetTracker />
          <BarcodeScanner onProductScanned={handleProductScanned} />
        </div>
        
        <Card className="card-glass flex-grow flex flex-col">
            <CardContent className="flex-grow flex flex-col p-4">
                <Tabs defaultValue="cart" className="flex-grow flex flex-col">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="cart">
                            <ShoppingCart className="mr-2 h-4 w-4" />
                            {t('yourCart')} ({isHydrated ? totalItems : <Loader2 className="h-4 w-4 animate-spin" />})
                        </TabsTrigger>
                        <TabsTrigger value="list">
                            <ListChecks className="mr-2 h-4 w-4" />
                            {t('todaysList')}
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="cart" className="flex-grow flex flex-col mt-4">
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                            placeholder={t('searchInCart')}
                            className="pl-10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <ScrollArea className="flex-grow h-32">
                            {!isHydrated ? (
                            <div className="space-y-4">
                                <Skeleton className="h-12 w-full" />
                                <Skeleton className="h-12 w-full" />
                            </div>
                            ) : cart.length === 0 ? (
                            <div className="text-center text-muted-foreground py-10">
                                <p>{t('cartIsEmpty')}</p>
                                <p>{t('scanToStart')}</p>
                            </div>
                            ) : (
                            <div className="space-y-4 pr-4">
                                {filteredCart.map(item => (
                                <div key={item.id} className="flex items-center gap-4">
                                    <Image
                                    src={getValidImageUrl(item.imageUrl)}
                                    alt={item.name}
                                    width={40}
                                    height={40}
                                    className="rounded-md object-cover"
                                    data-ai-hint="product image"
                                    />
                                    <div className="flex-1">
                                      <p className="font-semibold">{item.name}</p>
                                      <div className="flex items-baseline gap-2">
                                        <p className="text-sm text-primary font-medium">₹{item.price.toFixed(2)}</p>
                                        {item.originalPrice && item.originalPrice > item.price && (
                                            <p className="text-xs text-muted-foreground line-through">₹{item.originalPrice.toFixed(2)}</p>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleUpdateQuantity(item.id, -1)}>
                                        <Minus className="h-4 w-4" />
                                    </Button>
                                    <span className="font-bold w-4 text-center">{item.quantity}</span>
                                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleUpdateQuantity(item.id, 1)}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                    </div>
                                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeFromCart(item.id)}>
                                    <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                                ))}
                            </div>
                            )}
                        </ScrollArea>
                    </TabsContent>
                    <TabsContent value="list" className="flex-grow flex flex-col mt-4">
                        <TodaysList />
                    </TabsContent>
                </Tabs>
                
                <div className="mt-auto pt-4">
                  <Separator className="mb-4" />
                  <div className="space-y-4">
                      <div className="flex justify-between items-center font-bold text-lg">
                      <span>{t('total')}</span>
                      {isHydrated ? (
                          <span>₹{totalPrice.toFixed(2)}</span>
                      ) : (
                          <Skeleton className="h-6 w-24" />
                      )}
                      </div>

                      <div className="flex gap-2">
                          <AISavingsFinder />
                          <Link href="/checkout" passHref className="w-full">
                            <Button 
                            className="w-full" 
                            disabled={cart.length === 0 || !isHydrated}
                            >
                            {t('checkout')}
                            <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          </Link>
                      </div>
                  </div>
                </div>
            </CardContent>
        </Card>
      </div>
      {!isCameraActive && <BottomNav />}
    </div>
    
    </>
  );
}

export default function Home() {
  return (
    <AuthWrapper>
      <SpendWiseDashboard />
    </AuthWrapper>
  );
}
