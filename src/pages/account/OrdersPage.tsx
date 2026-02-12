import { Package } from "lucide-react";

const OrdersPage = () => {
  return (
    <div>
      <h2 className="font-display text-2xl font-semibold mb-6">Orders</h2>
      <div className="text-center py-16 text-muted-foreground">
        <Package className="w-12 h-12 mx-auto mb-4 opacity-30" />
        <p>No orders yet</p>
        <p className="text-sm mt-1">Your order history will appear here once you place your first order.</p>
      </div>
    </div>
  );
};

export default OrdersPage;
