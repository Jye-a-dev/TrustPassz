"use client";

import * as React from "react";
import { motion } from "motion/react";
import { Clock, Tag } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Item } from "../types/item";
import { formatCategoryLabel, getCategoryBadgeColor } from "../utils/item-helpers";

interface ItemCardProps {
  item: Item;
}

export function ItemCard({ item }: ItemCardProps) {
  const formattedDate = new Date(item.createdAt).toLocaleDateString("vi-VN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      transition={{ duration: 0.25 }}
      className="h-full"
    >
      <Card className="flex h-full flex-col justify-between transition-shadow hover:shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between gap-2 mb-1">
            <Badge variant={getCategoryBadgeColor(item.category)} className="capitalize text-xs font-normal">
              <Tag className="mr-1 size-3" />
              {formatCategoryLabel(item.category)}
            </Badge>
            <span className="flex items-center text-xs text-muted-foreground">
              <Clock className="mr-1 size-3" />
              {formattedDate}
            </span>
          </div>
          <CardTitle className="text-base line-clamp-1">{item.title}</CardTitle>
          <CardDescription className="line-clamp-3 text-xs leading-relaxed">
            {item.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/40">
            <span className="font-mono text-[11px] text-muted-foreground/80">ID: {item.id.slice(0, 8)}...</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500" />
              Đang hoạt động
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

