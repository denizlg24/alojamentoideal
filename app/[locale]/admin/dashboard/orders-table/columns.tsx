"use client";
import { IOrder } from "@/models/Order";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { DataTableColumnHeader } from "./data-table-column-header";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, SquareArrowOutUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export interface ITableOrder extends Omit<IOrder, "payment_id"> {
  payment_id: {
    status: string;
    payment_id: string;
  };
}

export type Order = ITableOrder;

export const columns: ColumnDef<Order>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },

  {
    accessorKey: "orderId",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Order ID" />
    ),
  },
  {
    accessorKey: "createdAt",
    cell: ({ row }) => {
      return (
        <div className="text-left">
          {format(new Date(row.getValue("createdAt")), "yyyy/MM/dd HH:ss")}
        </div>
      );
    },
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Creation date" />
    ),
  },
  {
    accessorKey: "payment_id",
    cell: ({ row }) => {
      let status = <></>;
      switch (
        (row.getValue("payment_id") as { status: string; payment_id: string })
          .status
      ) {
        case "canceled":
          status = (
            <div className="flex flex-row items-center justify-start gap-1">
              <div className="w-2 h-2 rounded-full bg-destructive"></div>
              <p>Canceled</p>
            </div>
          );
          break;
        case "processing":
          status = (
            <div className="flex flex-row items-center justify-start gap-1">
              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
              <p>Processing</p>
            </div>
          );
          break;
        case "requires_action":
          status = (
            <div className="flex flex-row items-center justify-start gap-1">
              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
              <p>Waiting action</p>
            </div>
          );
          break;
        case "requires_capture":
          status = (
            <div className="flex flex-row items-center justify-start gap-1">
              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
              <p>Waiting capture</p>
            </div>
          );
          break;
        case "requires_confirmation":
          status = (
            <div className="flex flex-row items-center justify-start gap-1">
              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
              <p>Waiting confirmation</p>
            </div>
          );

          break;
        case "requires_payment_method":
          status = (
            <div className="flex flex-row items-center justify-start gap-1">
              <div className="w-2 h-2 rounded-full bg-destructive"></div>
              <p>Card declined</p>
            </div>
          );
          break;
        case "succeeded":
          status = (
            <div className="flex flex-row items-center justify-start gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <p>Succeeded</p>
            </div>
          );
          break;
        case "not-found":
          status = (
            <div className="flex flex-row items-center justify-start gap-1">
              <div className="w-2 h-2 rounded-full bg-destructive"></div>
              <p>Not found</p>
            </div>
          );
          break;
      }
      return status;
    },
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Payment Status" />
    ),
    filterFn: (row, columnId, filterValue: string[] | string) => {
      const value = row.getValue(columnId) as {
        status: string;
        payment_id: string;
      };
      if (Array.isArray(filterValue)) {
        return filterValue.includes(value.status);
      }
      return value.status === filterValue;
    },
    sortingFn: (rowA, rowB, columnId) => {
      const a = rowA.getValue(columnId) as {
        status: string;
        payment_id: string;
      };
      const b = rowB.getValue(columnId) as {
        status: string;
        payment_id: string;
      };

      if (a.status < b.status) return -1;
      if (a.status > b.status) return 1;

      if (a.payment_id < b.payment_id) return -1;
      if (a.payment_id > b.payment_id) return 1;

      return 0;
    },
  },
  {
    accessorKey: "reservationReferences",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Booking Codes" />
    ),
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
  },
  {
    accessorKey: "notes",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Notes" />
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const order = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href={`/admin/dashboard/orders/${order.orderId}`}>
                View Order
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {order.reservationIds.length == 1 && (
              <DropdownMenuItem asChild>
                <Link
                  href={`https://go.hostify.com/reservations/view/${order.reservationIds[0]}`}
                  target="_blank"
                >
                  Hostify Booking
                  <SquareArrowOutUpRight />
                </Link>
              </DropdownMenuItem>
            )}
            {order.reservationIds.length > 1 && (
              <DropdownMenuItem asChild>
                <Dialog>
                  <DialogTrigger className="w-full hover:bg-accent focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:!text-destructive [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4">
                    View Hostify Bookings
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Hostify Reservations</DialogTitle>
                      <DialogDescription>
                        View each reservation on Hostify
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-2">
                      {order.reservationIds.map((id, indx) => {
                        return (
                          <Button
                            key={id + "-reservation-btn"}
                            asChild
                            variant={"secondary"}
                          >
                            <Link
                              href={`https://go.hostify.com/reservations/view/${id}`}
                              target="_blank"
                            >
                              View {order.reservationReferences[indx]}{" "}
                              <SquareArrowOutUpRight />
                            </Link>
                          </Button>
                        );
                      })}
                    </div>
                  </DialogContent>
                </Dialog>
              </DropdownMenuItem>
            )}

            <DropdownMenuItem asChild>
              <Link
                target="_blank"
                href={`https://dashboard.stripe.com/${
                  process.env.NODE_ENV === "development" ? "test/" : ""
                }payments/${order.payment_id.payment_id}`}
              >
                View payment details
                <SquareArrowOutUpRight />
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
