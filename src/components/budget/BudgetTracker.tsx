
'use client';

import * as React from 'react';
import { useCart } from '@/hooks/use-cart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, Edit } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';

export default function BudgetTracker() {
  const { totalBudget, totalPrice, setBudget } = useCart();
  const [newBudget, setNewBudget] = React.useState(totalBudget.toString());

  const spentPercentage = totalBudget > 0 ? (totalPrice / totalBudget) * 100 : 0;
  const remainingAmount = totalBudget - totalPrice;

  const getProgressColor = () => {
    if (spentPercentage >= 90) return 'progress-bar-red';
    if (spentPercentage >= 80) return 'progress-bar-orange';
    if (spentPercentage >= 50) return 'progress-bar-yellow';
    return 'progress-bar-green';
  };
  
  React.useEffect(() => {
    setNewBudget(totalBudget.toString());
  }, [totalBudget]);

  const handleSetBudget = () => {
    const budgetValue = parseFloat(newBudget);
    if (!isNaN(budgetValue) && budgetValue > 0) {
      setBudget(budgetValue, true); // Retain cart items when updating
    }
  };

  return (
    <Card className="card-glass w-full">
      <CardHeader className='pb-2'>
        <CardTitle className="flex items-center justify-between text-base font-medium">
            Budget Overview
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                        <Edit className="h-4 w-4" />
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Update Your Budget</AlertDialogTitle>
                    <AlertDialogDescription>
                        Enter your new total budget. Your current spent amount will be retained.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <Input
                        type="number"
                        placeholder="Enter new budget"
                        value={newBudget}
                        onChange={(e) => setNewBudget(e.target.value)}
                    />
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleSetBudget}>Update</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </CardTitle>
        {totalBudget === 0 && (
            <CardDescription className="text-destructive flex items-center gap-1 text-xs">
                <AlertCircle className="h-3 w-3" />
                No budget set.
            </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
            <Progress value={spentPercentage} className="h-2" indicatorClassName={getProgressColor()} />
            <div className="flex justify-between text-sm font-medium">
                <span className="text-muted-foreground">Spent: <span className="text-foreground font-bold">₹{totalPrice.toFixed(2)}</span></span>
                <span className="text-muted-foreground">Remaining: <span className="text-foreground font-bold text-green-500">₹{remainingAmount.toFixed(2)}</span></span>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
