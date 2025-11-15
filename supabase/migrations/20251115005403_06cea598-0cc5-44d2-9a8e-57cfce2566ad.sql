-- Fix: Allow users to view their own purchase items
CREATE POLICY "Users can view own purchase items" 
ON purchase_items 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM purchases 
    WHERE purchases.id = purchase_items.purchase_id 
    AND purchases.user_id = auth.uid()
  )
);