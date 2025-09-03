
'use client';

import * as React from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Input } from '../ui/input';
import { useCart } from '@/hooks/use-cart';

export function BudgetExceededDialog() {
  const {
    isBudgetModalOpen,
    closeBudgetModal,
    totalBudget,
    setBudget,
    pendingProduct,
  } = useCart();

  const [newBudget, setNewBudget] = React.useState(totalBudget.toString());

  React.useEffect(() => {
    // Keep local state in sync with global state when the dialog opens
    if (isBudgetModalOpen) {
      setNewBudget(totalBudget.toString());
    }
  }, [isBudgetModalOpen, totalBudget]);

  const handleUpdateAndAdd = () => {
    const budgetValue = parseFloat(newBudget);
    if (!isNaN(budgetValue) && budgetValue > 0) {
      setBudget(budgetValue, true); // This will also close the modal and retry adding the product
    }
  };

  const handleClose = () => {
    closeBudgetModal();
  }

  return (
    <AlertDialog open={isBudgetModalOpen} onOpenChange={(open) => !open && handleClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Budget Exceeded!</AlertDialogTitle>
          <AlertDialogDescription>
            Adding "{pendingProduct?.name}" would exceed your current budget. To add it, please increase your budget below.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="my-4">
            <Input
                id="newBudget"
                type="number"
                placeholder="Enter new budget"
                value={newBudget}
                onChange={(e) => setNewBudget(e.target.value)}
            />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleUpdateAndAdd}>
            Update & Add Item
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
