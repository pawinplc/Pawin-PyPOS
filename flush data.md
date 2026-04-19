# Flush Data Commands

Useful SQL commands for clearing data while preserving the system structure.

## 1. Clear Sales History
This command removes all sales records and stock movement history, but keeps categories and items intact for immediate scanning/use.

```sql
-- Clear all sales history (keeps items for scanning)
DELETE FROM sale_items;
DELETE FROM sales;
DELETE FROM stock_movements;
```

> [!CAUTION]
> Running these commands will permanently delete all transaction history. Make sure to export your reports first if needed.
