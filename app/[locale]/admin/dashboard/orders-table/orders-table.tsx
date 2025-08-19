"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  getFilteredRowModel,
  VisibilityState,
  ColumnFiltersState,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  EyeOff,
  Trash,
  Loader2,
} from "lucide-react";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}
import { Table as TanstackTable } from "@tanstack/react-table";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { deleteOrder } from "@/app/actions/deleteOrder";
import { useRouter } from "@/i18n/navigation";
interface DataTablePaginationProps<TData> {
  table: TanstackTable<TData>;
}

export function DataTablePagination<TData>({
  table,
}: DataTablePaginationProps<TData>) {
  return (
    <div className="flex items-center justify-center mt-2 w-full">
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="icon"
          className="hidden size-8 lg:flex"
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
        >
          <span className="sr-only">Go to first page</span>
          <ChevronsLeft />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          <span className="sr-only">Go to previous page</span>
          <ChevronLeft />
        </Button>
        <div className="flex sm:w-full sm:items-center justify-center text-sm font-medium">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount()}
        </div>
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          <span className="sr-only">Go to next page</span>
          <ChevronRight />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="hidden size-8 lg:flex"
          onClick={() => table.setPageIndex(table.getPageCount() - 1)}
          disabled={!table.getCanNextPage()}
        >
          <span className="sr-only">Go to last page</span>
          <ChevronsRight />
        </Button>
      </div>
    </div>
  );
}

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState({});
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getSortedRowModel: getSortedRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, columnIds, filterValue) => {
      const email = row.getValue("email") as string;
      const orderId = row.getValue("orderId") as string;
      const reservationReferences = row.getValue(
        "reservationReferences"
      ) as string[];
      const search = filterValue.toLowerCase();

      return (
        email.toLowerCase().includes(search) ||
        orderId.toLowerCase().includes(search) ||
        reservationReferences.filter((reference) =>
          reference.includes(search.toUpperCase())
        ).length > 0
      );
    },
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      globalFilter,
      columnVisibility,
      columnFilters,
      rowSelection,
    },
  });

  const { isMobile } = useSidebar();

  return (
    <div className="w-full flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-start py-4 gap-4">
        <Tabs
          onValueChange={(value) => {
            switch (value) {
              case "all":
                table.getColumn("payment_id")?.setFilterValue("");
                break;
              case "succeeded":
                table.getColumn("payment_id")?.setFilterValue("succeeded");
                break;
              case "canceled":
                table.getColumn("payment_id")?.setFilterValue("canceled");
                break;
              case "processing":
                table.getColumn("payment_id")?.setFilterValue("processing");
                break;
              case "requires_action,requires_confirmation,requires_capture":
                table
                  .getColumn("payment_id")
                  ?.setFilterValue([
                    "requires_action",
                    "requires_confirmation",
                    "requires_capture",
                  ]);

                break;
              case "requires_payment_method":
                table
                  .getColumn("payment_id")
                  ?.setFilterValue("requires_payment_method");
                break;
            }
          }}
          defaultValue="all"
        >
          <TabsList className="flex-wrap h-full!">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="succeeded">Succeeded</TabsTrigger>
            <TabsTrigger value="requires_action,requires_confirmation,requires_capture">
              Pending
            </TabsTrigger>
            <TabsTrigger value="processing">Processing</TabsTrigger>
            <TabsTrigger value="requires_payment_method">
              Card Declined
            </TabsTrigger>
            <TabsTrigger value="canceled">Canceled</TabsTrigger>
          </TabsList>
        </Tabs>
        <Input
          placeholder="Filter emails, order IDs or Booking codes..."
          value={globalFilter ?? ""}
          onChange={(event) => setGlobalFilter(event.target.value)}
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              Columns <EyeOff />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {
                      {
                        orderId: "Order ID",
                        createdAt: "Creation date",
                        payment_id: "Payment Status",
                        reservationReferences: "Booking Codes",
                        email: "Email",
                        name: "Name",
                        notes: "Notes",
                      }[column.id]
                    }
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="ml-auto shrink-0 flex items-center justify-end space-x-2">
          <p className="text-sm font-medium">Rows per page</p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[5, 10, 15, 20, 30, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div
        className={cn(
          "overflow-hidden rounded-md border w-full max-w-[calc(100vw-86px)]!",
          isMobile && "max-w-full!"
        )}
      >
        <Table className="w-full">
          <TableHeader className="bg-accent">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-row items-center gap-2 w-full -mb-4">
        {table.getFilteredSelectedRowModel().rows.length > 0 && (
          <>
            <Button
              onClick={async () => {
                setDeleting(true);
                for (const orderRow of table.getFilteredSelectedRowModel()
                  .rows) {
                  const orderId = orderRow.getValue("orderId") as string;
                  await deleteOrder(orderId);
                }
                router.refresh();
              }}
            >
              {deleting ? (
                <>
                  <Loader2 className="animate-spin" /> Deleting...
                </>
              ) : (
                <>
                  {" "}
                  <Trash />
                  Delete {table.getFilteredSelectedRowModel().rows.length}{" "}
                  orders.
                </>
              )}
            </Button>
          </>
        )}
        <p className="text-muted-foreground text-sm px-2 text-right ml-auto">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </p>
      </div>

      <DataTablePagination table={table} />
    </div>
  );
}
