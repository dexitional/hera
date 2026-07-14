import { deleteCategoryFn, getCategoriesFn } from "#/server/tenant-events";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Edit2,
  FolderTree,
  Hash,
  Loader2,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";

const CATEGORIES_PAGE_SIZE = 15;

const categoriesQueryOptions = (params: {
  eventId: any;
  page: number;
  pageSize: number;
  searchQuery: string;
}) => ({
  queryKey: ["categories-admin", params.eventId, params.page, params.pageSize, params.searchQuery],
  queryFn: () => getCategoriesFn({ data: params } as any),
  placeholderData: keepPreviousData,
});

export const Route = createFileRoute("/admin/events/$eventId/categories/")({
  component: CategoriesDirectory,
  loader: async ({ context, params }: any) => {
    const eventId = params.eventId;
    await context.queryClient.ensureQueryData(categoriesQueryOptions({
      eventId, page: 1, pageSize: CATEGORIES_PAGE_SIZE, searchQuery: "",
    }));
  },
  pendingComponent: () => (
    <div className="flex justify-center p-12">
      <Loader2 className="animate-spin text-purple-500" />
    </div>
  ),
});

function CategoriesDirectory() {
  const queryClient = useQueryClient();
  const { eventId } = Route.useParams();

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [jumpToPageInput, setJumpToPageInput] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearchQuery(searchQuery.trim()), 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearchQuery]);

  const { data }: any = useQuery(categoriesQueryOptions({
    eventId, page, pageSize: CATEGORIES_PAGE_SIZE, searchQuery: debouncedSearchQuery,
  }));

  const categories: any = (data?.categories ?? []).map((r: any) => ({
    id: r?.category.id,
    eventId: r.event?.id,
    name: r.category?.name,
    description: r.category?.description,
    code: r.category?.code,
    eventTitle: r.event?.title,
    contestantsCount: r.contestantsCount,
  }));

  const totalCount: number = data?.pagination?.totalCount ?? 0;
  const totalPages: number = Math.max(data?.pagination?.totalPages ?? 1, 1);
  const isFetchingCategories = !data;

  const handleJumpToPage = () => {
    const parsed = Number(jumpToPageInput);
    if (!Number.isFinite(parsed)) return;
    setPage(Math.min(Math.max(Math.floor(parsed), 1), totalPages));
    setJumpToPageInput("");
  };

  const deleteMutation = useMutation({
    mutationFn: deleteCategoryFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories-admin"] });
    },
    onError: (error: any) => console.error(error.message),
  });

  const handleDeleteCategory = (id: any) => {
    if (
      confirm(
        "Are you sure you want to remove this category? Removing this will cascade and affect contestants attached to this category!",
      )
    ) {
      deleteMutation.mutate({ data: id } as any);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* ================= BACK NAVIGATION ================= */}
      <Link
        to="/admin/events/$eventId/manage"
        params={{ eventId }}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Management Console
      </Link>

      {/* ================= HEADER SECTION ================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0a192a]/50 p-6 rounded-xl border border-zinc-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Category Manager
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Configure award/ballot subdivisions, assign unique interaction codes, and organize your voting categories.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/admin/events/$eventId/categories/new"
            params={{ eventId }}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white text-xs px-3.5 py-2 rounded-lg font-medium shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Category</span>
          </Link>
        </div>
      </div>

      {/* ================= QUICK SEARCH ================= */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/80 relative z-30">
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Search category name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0a192a]/50 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-500" />
        </div>
      </div>

      {/* ================= CATEGORIES TABLE DATA GRID ================= */}
      <div className="bg-[#0a192a]/50 rounded-xl border border-zinc-800 overflow-hidden shadow-2xl relative z-10">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800/60 bg-zinc-900/20 text-zinc-400 text-[11px] font-bold uppercase tracking-wider select-none">
                <th className="px-6 py-4">Category Designation</th>
                <th className="px-6 py-4">Interaction Code</th>
                <th className="px-4 py-4 text-center">Contestants</th>
                <th className="px-6 py-4 text-right">Action Overrides</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900 text-sm">
              {categories.length > 0 ? (
                categories.map((category: any) => (
                  <tr
                    key={category.id}
                    className="hover:bg-zinc-900/20 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                          <FolderTree className="w-4 h-4 text-purple-400" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-white tracking-wide">
                            {category.name}
                          </span>
                          <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1 max-w-xs">
                            {category.description}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 align-middle">
                      <div className="inline-flex items-center gap-1 text-xs font-mono font-bold bg-zinc-900 border border-zinc-800 text-zinc-300 px-2.5 py-1 rounded shadow-inner">
                        <Hash className="w-3 h-3 text-zinc-500" />
                        <span>{category.code}</span>
                      </div>
                    </td>

                    <td className="px-4 py-4 align-middle text-center">
                      <div className="inline-flex items-center gap-2 text-xs font-mono font-bold bg-zinc-900 border border-zinc-800 text-zinc-300 px-2.5 py-1 rounded shadow-inner">
                        <Users className="w-3 h-3 text-zinc-500" />
                        <span>{category?.contestantsCount}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 align-middle text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to="/admin/events/$eventId/categories/$categoryId/edit"
                          params={{ eventId, categoryId: String(category.id) }}
                          title="Edit Category Config"
                          className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          title="Delete Record"
                          className="p-1.5 rounded text-zinc-500 hover:text-red-400 hover:bg-red-950/20 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="text-center py-12 text-zinc-500 text-xs border border-dashed border-zinc-900 rounded-b-xl"
                  >
                    No categories found matching sorting parameters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ================= PAGINATION BOTTOM ELEMENT BAR ================= */}
        <div className="p-4 bg-zinc-900/40 border-t border-zinc-800/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs text-zinc-400">
            {isFetchingCategories
              ? "Loading categories..."
              : <>Showing Page <b className="text-white">{page}</b> of <b className="text-white">{totalPages}</b> ({totalCount} entries)</>
            }
          </span>

          <div className="flex gap-2 w-full sm:w-auto justify-end items-center">
            <button
              disabled={page <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className="flex items-center gap-1 text-xs px-3 py-1.5 border border-zinc-800 rounded-lg bg-zinc-900 text-zinc-300 disabled:opacity-30 disabled:pointer-events-none hover:bg-zinc-800 transition-all cursor-pointer"
            >
              Previous
            </button>

            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={1}
                max={totalPages}
                value={jumpToPageInput}
                onChange={(e) => setJumpToPageInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleJumpToPage()}
                placeholder={`${page}`}
                className="w-14 bg-[#0a192a]/50 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-white text-center placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                disabled={!jumpToPageInput}
                onClick={handleJumpToPage}
                className="text-xs px-3 py-1.5 border border-zinc-800 rounded-lg bg-zinc-900 text-zinc-300 disabled:opacity-30 disabled:pointer-events-none hover:bg-zinc-800 transition-all cursor-pointer"
              >
                Go
              </button>
            </div>

            <button
              disabled={page >= totalPages}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              className="flex items-center gap-1 text-xs px-3 py-1.5 border border-zinc-800 rounded-lg bg-zinc-900 text-zinc-300 disabled:opacity-30 disabled:pointer-events-none hover:bg-zinc-800 transition-all cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
