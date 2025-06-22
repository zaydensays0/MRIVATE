import { FileCloaker } from "@/components/file-cloaker";

export default function Home() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-start bg-background p-4 sm:p-8 md:p-12">
      <div className="w-full max-w-4xl">
        <FileCloaker />
      </div>
    </main>
  );
}
