import Header from "@/components/Header";
import KanbanBoard from "@/components/KanbanBoard";

export default function BoardPage() {
  return (
    <>
      <Header title="Board" />
      <main className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        <KanbanBoard />
      </main>
    </>
  );
}
