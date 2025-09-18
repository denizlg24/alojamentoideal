"use client";

import { IHostkitApiKeyDocument } from "@/models/HostkitApiKey";
import { ListingType } from "@/schemas/listing.schema";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit, Loader2, PlusSquare } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { addHostkitApiKey } from "@/app/actions/addHostkitApiKey";
import { useRouter } from "@/i18n/navigation";
import { editHostkitApiKey } from "@/app/actions/editHostkitApiKey";

export const HostKitApiCard = ({
  listing,
  apiKey,
}: {
  listing: ListingType;
  apiKey: IHostkitApiKeyDocument | undefined;
}) => {
  const [editValue, setEditValue] = useState("");
  const [adding, setAdding] = useState(false);
  const router = useRouter();
  const handleCreate = async () => {
    setAdding(true);
    await addHostkitApiKey({
      listingId: listing.id.toString(),
      apiKey: editValue,
    });
    router.refresh();
  };
  const handleEdit = async () => {
    setAdding(true);
    await editHostkitApiKey({
      listingId: listing.id.toString(),
      apiKey: editValue,
    });
    router.refresh();
  };

  return (
    <Card className="p-2! rounded! flex flex-col gap-1" key={listing.id}>
      <Image unoptimized 
        src={listing.thumbnail_file}
        alt="photo"
        width={1920}
        height={1080}
        className="w-full h-auto aspect-[3/1]! object-cover"
      />
      <h1 className="text-xs font-bold">{listing.name}</h1>
      {apiKey && (
        <div className="w-full bg-green-100 p-0.5 rounded shadow-xs flex flex-row items-center gap-1 mt-auto">
          <p className="w-[90%] truncate text-xs">{apiKey.hostkitApiKey}</p>
          <Dialog>
            <DialogTrigger asChild>
              <Button
                className="p-0.5! h-fit! w-auto aspect-square rounded-none!"
                variant={"ghost"}
                size={"icon"}
              >
                <Edit />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Hostkit API KEY</DialogTitle>
                <DialogDescription>
                  Get the key{" "}
                  <span className="font-semibold">
                    Properties {">"} Room {">"} Operations {">"} Hostkit API Key
                  </span>
                </DialogDescription>
              </DialogHeader>
              <Label>HOSTKIT API KEY:</Label>
              <Input
                value={editValue}
                onChange={(e) => {
                  setEditValue(e.target.value);
                }}
                placeholder={apiKey.hostkitApiKey}
                className="w-full"
              />
              <Button
                onClick={() => {
                  handleEdit();
                }}
                className="w-full"
              >
                {adding ? (
                  <>
                    <Loader2 className="animate-spin" /> Submitting...
                  </>
                ) : (
                  <>Submit</>
                )}
              </Button>
            </DialogContent>
          </Dialog>
        </div>
      )}
      {!apiKey && (
        <Dialog>
          <DialogTrigger asChild>
            <Button className="p-0.5! h-fit! w-auto rounded!">
              Add HostKit API Key
              <PlusSquare />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Hostkit API KEY</DialogTitle>
              <DialogDescription>
                Get the key{" "}
                <span className="font-semibold">
                  Properties {">"} Room {">"} Operations {">"} Hostkit API Key
                </span>
              </DialogDescription>
            </DialogHeader>
            <Label>HOSTKIT API KEY:</Label>
            <Input
              value={editValue}
              onChange={(e) => {
                setEditValue(e.target.value);
              }}
              className="w-full"
            />
            <Button
              disabled={adding}
              onClick={() => {
                handleCreate();
              }}
              className="w-full"
            >
              {adding ? (
                <>
                  <Loader2 className="animate-spin" /> Submitting...
                </>
              ) : (
                <>Submit</>
              )}
            </Button>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
};
