"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Reveal } from "@/components/motion/Reveal";
import { useCounterStore } from "@/lib/stores/useCounterStore";
import { useAppStatus } from "@/lib/query/useAppStatus";

export default function Home() {
  const { count, inc, dec, reset } = useCounterStore();
  const { data, isLoading, error } = useAppStatus();
  const [name, setName] = useState("");

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-3xl space-y-6">
        <Reveal>
          <h1 className="text-3xl sm:text-4xl font-heading font-semibold tracking-tight">
            Capstone Starter
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
            Next.js App Router + TypeScript + Tailwind + shadcn/ui + Zustand + Framer Motion + TanStack Query
          </p>
        </Reveal>

        <Reveal delay={0.05}>
          <Card>
            <CardHeader>
              <CardTitle>TanStack Query</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                <p className="text-sm text-muted-foreground">로딩 중...</p>
              ) : error ? (
                <p className="text-sm text-destructive">에러: {String(error)}</p>
              ) : (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">status</p>
                  <p className="text-2xl font-heading font-medium tabular-nums">
                    {data?.status ?? "-"}
                  </p>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                이 페이지는 외부 API 없이도 query provider 연결이 되는지 확인하기 위한 예제입니다.
              </p>
            </CardContent>
          </Card>
        </Reveal>

        <Reveal delay={0.1}>
          <Card>
            <CardHeader>
              <CardTitle>Zustand + UI</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="text-2xl sm:text-3xl font-heading tabular-nums">
                  {count}
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={dec}>
                    -
                  </Button>
                  <Button onClick={inc}>+</Button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button variant="ghost" onClick={reset}>
                  Reset
                </Button>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="이름을 입력하세요"
                />
              </div>

              <p className="text-sm text-muted-foreground">
                입력값: {name ? name : "없음"}
              </p>
            </CardContent>
          </Card>
        </Reveal>
      </div>
    </div>
  );
}
