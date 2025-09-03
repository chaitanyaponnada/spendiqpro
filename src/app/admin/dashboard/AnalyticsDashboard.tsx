
'use client';

import * as React from 'react';
import { collection, getDocs, orderBy, query, Timestamp, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, TrendingUp, ShoppingCart, DollarSign, Package, BarChart as BarChartIcon, CalendarDays, Users, ListOrdered, IndianRupee, LineChart as LineChartIcon } from 'lucide-react';
import type { CartItem } from '@/types';
import {
  Area,
  AreaChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Line,
  LineChart
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useStore } from '@/hooks/use-store';


interface PurchaseRecord {
  id: string;
  items: CartItem[];
  totalPrice: number;
  purchaseDate: Timestamp;
  storeId: string;
}

interface ProductSaleData {
  id: string;
  name: string;
  brand: string;
  category: string;
  totalQuantity: number;
  totalRevenue: number;
}

interface SalesData {
    date: string;
    revenue: number;
}

type DateRange = 'today' | '7d' | '30d' | 'all';

export function AnalyticsDashboard() {
  const { toast } = useToast();
  const { storeId } = useStore();
  const [isLoading, setIsLoading] = React.useState(true);
  const [dateRange, setDateRange] = React.useState<DateRange>('30d');
  
  // All-time data for the specific store
  const [allTimePurchases, setAllTimePurchases] = React.useState<PurchaseRecord[]>([]);

  // Data filtered by date range
  const [totalRevenue, setTotalRevenue] = React.useState(0);
  const [totalOrders, setTotalOrders] = React.useState(0);
  const [avgOrderValue, setAvgOrderValue] = React.useState(0);
  const [todaysSales, setTodaysSales] = React.useState(0);
  const [productSales, setProductSales] = React.useState<ProductSaleData[]>([]);
  const [salesByDate, setSalesByDate] = React.useState<SalesData[]>([]);


  React.useEffect(() => {
    const fetchAllPurchaseData = async () => {
      if (!storeId) {
          setIsLoading(false);
          return;
      }
      setIsLoading(true);
      try {
        const historyCol = collection(db, 'purchaseHistory');
        const q = query(
            historyCol, 
            where('storeId', '==', storeId),
            orderBy('purchaseDate', 'desc')
        );
        const querySnapshot = await getDocs(q);

        const purchaseHistory = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as PurchaseRecord));

        setAllTimePurchases(purchaseHistory);

      } catch (error: any) {
        console.error("Error fetching purchase history: ", error);
        toast({
          variant: 'destructive',
          title: 'Error Fetching Analytics',
          description: 'Could not fetch purchase history. The required database index might still be deploying. Please try again in a few minutes.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllPurchaseData();
  }, [storeId, toast]);

  React.useEffect(() => {
    processAnalytics(allTimePurchases, dateRange);

    // Calculate today's sales separately, regardless of range selection
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaysData = allTimePurchases.filter(p => p.purchaseDate.toDate() >= today);
    const totalToday = todaysData.reduce((acc, record) => acc + record.totalPrice, 0);
    setTodaysSales(totalToday);

  }, [allTimePurchases, dateRange]);


  const processAnalytics = (history: PurchaseRecord[], range: DateRange) => {
    const now = new Date();
    let startDate = new Date(0); // The beginning of time

    if (range === 'today') {
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
    } else if (range === '7d') {
      startDate = new Date(new Date().setDate(now.getDate() - 7));
       startDate.setHours(0, 0, 0, 0);
    } else if (range === '30d') {
      startDate = new Date(new Date().setDate(now.getDate() - 30));
       startDate.setHours(0, 0, 0, 0);
    }

    const filteredHistory = history.filter(record => record.purchaseDate.toDate() >= startDate);

    const revenue = filteredHistory.reduce((acc, record) => acc + record.totalPrice, 0);
    setTotalRevenue(revenue);
    setTotalOrders(filteredHistory.length);
    setAvgOrderValue(filteredHistory.length > 0 ? revenue / filteredHistory.length : 0);

    const salesMap = new Map<string, ProductSaleData>();
    const salesByDateMap = new Map<string, number>();

    filteredHistory.forEach(record => {
      // Sales by Date
      const dateKey = record.purchaseDate.toDate().toISOString().split('T')[0];
      salesByDateMap.set(dateKey, (salesByDateMap.get(dateKey) || 0) + record.totalPrice);
        
      record.items.forEach(item => {
        // Ensure price and quantity are valid numbers, default to 0 if not.
        const price = typeof item.price === 'number' ? item.price : 0;
        const quantity = typeof item.quantity === 'number' ? item.quantity : 0;
        const revenueForItem = price * quantity;
        
        // Product Sales
        const existingEntry = salesMap.get(item.id);
        if (existingEntry) {
          existingEntry.totalQuantity += quantity;
          existingEntry.totalRevenue += revenueForItem;
        } else {
          salesMap.set(item.id, {
            id: item.id,
            name: item.name,
            brand: item.brand,
            category: item.category,
            totalQuantity: quantity,
            totalRevenue: revenueForItem,
          });
        }
      });
    });

    setProductSales(Array.from(salesMap.values()));
    setSalesByDate(
      Array.from(salesByDateMap.entries())
        .map(([date, revenue]) => ({ date, revenue }))
        .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    );
  };
  
  const formatDateForChart = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const topSellingProducts = React.useMemo(() => 
    [...productSales].sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 5),
    [productSales]
  );
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-2 bg-background/80 backdrop-blur-sm border rounded-md shadow-lg">
          <p className="font-bold">{formatDateForChart(label)}</p>
          <p className="text-primary flex items-center">{`Revenue: `}<IndianRupee className="h-4 w-4 ml-1"/>{`${payload[0].value.toFixed(2)}`}</p>
        </div>
      );
    }
    return null;
  };


  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-60">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-2xl font-bold tracking-tight">Sales Overview</h2>
            <div className="flex items-center gap-2">
                <Button variant={dateRange === 'today' ? 'default' : 'outline'} size="sm" onClick={() => setDateRange('today')}>Today</Button>
                <Button variant={dateRange === '7d' ? 'default' : 'outline'} size="sm" onClick={() => setDateRange('7d')}>7 Days</Button>
                <Button variant={dateRange === '30d' ? 'default' : 'outline'} size="sm" onClick={() => setDateRange('30d')}>30 Days</Button>
                <Button variant={dateRange === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setDateRange('all')}>All Time</Button>
            </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold flex items-center"><IndianRupee className="h-6 w-6 mr-1"/>{totalRevenue.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">For the selected period</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold flex items-center"><IndianRupee className="h-6 w-6 mr-1"/>{todaysSales.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">Total for today</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                    <ListOrdered className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">+{totalOrders}</div>
                     <p className="text-xs text-muted-foreground">Completed checkouts in this period</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg. Order Value</CardTitle>
                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold flex items-center"><IndianRupee className="h-6 w-6 mr-1"/>{avgOrderValue.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">For the selected period</p>
                </CardContent>
            </Card>
        </div>
        
        <div className="grid gap-6 lg:grid-cols-5">
            <Card className="lg:col-span-3">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><LineChartIcon /> Sales Over Time</CardTitle>
                     <CardDescription>Revenue trend for the selected period.</CardDescription>
                </CardHeader>
                <CardContent>
                     {salesByDate.length > 1 ? (
                        <ResponsiveContainer width="100%" height={300}>
                             <LineChart data={salesByDate} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis 
                                    dataKey="date" 
                                    tickFormatter={formatDateForChart}
                                    tick={{ fontSize: 12 }} 
                                    interval="preserveStartEnd"
                                />
                                <YAxis 
                                    tickFormatter={(value) => `₹${value / 1000}k`} 
                                    tick={{ fontSize: 12 }} 
                                    width={50}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                                <Line 
                                    type="monotone" 
                                    dataKey="revenue" 
                                    stroke="hsl(var(--primary))" 
                                    strokeWidth={2} 
                                    dot={{ r: 4, fill: "hsl(var(--primary))" }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                            Not enough data to display a trend. Select a wider date range.
                        </div>
                    )}
                </CardContent>
            </Card>
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><TrendingUp /> Top 5 Products</CardTitle>
                    <CardDescription>By revenue generated in the selected period.</CardDescription>
                </CardHeader>
                <CardContent>
                    {topSellingProducts.length > 0 ? (
                       <div className="space-y-4">
                           {topSellingProducts.map((product) => (
                               <div key={product.id} className="space-y-4">
                                   <div className="flex justify-between items-center text-sm">
                                       <div>
                                           <p className="font-semibold">{product.name}</p>
                                           <p className="text-xs text-muted-foreground">
                                                Sold: {product.totalQuantity}
                                           </p>
                                       </div>
                                       <p className="font-bold flex items-center"><IndianRupee className="h-4 w-4 mr-0.5" />{product.totalRevenue.toFixed(2)}</p>
                                   </div>
                                   <Separator/>
                               </div>
                           ))}
                       </div>
                    ) : (
                         <div className="flex items-center justify-center h-[240px] text-muted-foreground">
                            No sales data for this period.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
