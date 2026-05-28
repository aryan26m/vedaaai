'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { api, type Assignment } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, formatDate, getStatusColor } from '@/lib/utils';
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Trash2,
  FileText,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center py-24"
    >
      <div className="relative mb-6">
        <div className="flex h-32 w-32 items-center justify-center rounded-full bg-neutral-100">
          <FileText className="h-14 w-14 text-neutral-300" />
        </div>
        <div className="absolute -bottom-1 -right-1 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      </div>
      <h2 className="mb-2 text-xl font-semibold text-neutral-900">No assignments yet</h2>
      <p className="mb-8 max-w-md text-center text-sm text-neutral-500">
        Create your first assignment to start collecting and grading student submissions.
        You can set up rubrics, define marking criteria, and let AI assist with grading.
      </p>
      <Link href="/assignments/create">
        <Button className="gap-2 rounded-xl bg-neutral-900 px-6 text-white hover:bg-neutral-800">
          <Plus className="h-4 w-4" />
          Create Your First Assignment
        </Button>
      </Link>
    </motion.div>
  );
}

function AssignmentCardSkeleton() {
  return (
    <div className="rounded-xl border bg-white p-5">
      <Skeleton className="mb-3 h-5 w-3/4" />
      <Skeleton className="mb-2 h-4 w-1/2" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

function AssignmentCard({ assignment, onDelete }: { assignment: Assignment; onDelete: (id: string) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      className="group relative rounded-xl border bg-white p-5 transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="mb-1 truncate text-base font-semibold text-neutral-900">
            {assignment.title}
          </h3>
          <div className="flex items-center gap-2 mb-2">
            <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', getStatusColor(assignment.status))}>
              {assignment.status}
            </span>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-neutral-400 opacity-0 transition-all hover:bg-neutral-100 hover:text-neutral-600 group-hover:opacity-100"
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute right-0 top-8 z-20 w-44 rounded-lg border bg-white py-1 shadow-lg"
              >
                <Link
                  href={
                    assignment.status === 'completed'
                      ? `/assignments/${assignment._id}/assessment`
                      : `/assignments/${assignment._id}`
                  }
                  className="flex items-center gap-2.5 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                  onClick={() => setMenuOpen(false)}
                >
                  <Eye className="h-3.5 w-3.5" />
                  View Assignment
                </Link>
                <button
                  onClick={() => {
                    onDelete(assignment._id);
                    setMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </motion.div>
            </>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-4 text-xs text-neutral-500">
        <span>Assigned on : {formatDate(assignment.createdAt)}</span>
        {assignment.dueDate && (
          <span>Due : {formatDate(assignment.dueDate)}</span>
        )}
      </div>
    </motion.div>
  );
}

export default function AssignmentsPage() {
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['assignments', search],
    queryFn: () => api.getAssignments({ search: search || undefined }),
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteAssignment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      toast.success('Assignment deleted');
    },
    onError: () => toast.error('Failed to delete assignment'),
  });

  const assignments = data?.data?.assignments || [];
  const isEmpty = !isLoading && assignments.length === 0 && !search;

  return (
    <div>
      {!isEmpty && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center gap-2 mb-1">
            <FileText className="h-5 w-5 text-neutral-700" />
            <h1 className="text-2xl font-bold text-neutral-900">Assignments</h1>
          </div>
          <p className="text-sm text-neutral-500">
            Manage and create assignments for your classes.
          </p>
        </motion.div>
      )}

      {!isEmpty && (
        <div className="mb-6 flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm text-neutral-600 transition-colors hover:bg-neutral-50">
            <Filter className="h-3.5 w-3.5" />
            Filter By
          </button>
          <div className="relative flex-1 max-w-xs ml-auto">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              placeholder="Search Assignment"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <AssignmentCardSkeleton key={i} />
          ))}
        </div>
      ) : isEmpty ? (
        <EmptyState />
      ) : (
        <>
          <AnimatePresence mode="popLayout">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {assignments.map((assignment) => (
                <AssignmentCard
                  key={assignment._id}
                  assignment={assignment}
                  onDelete={(id) => deleteMutation.mutate(id)}
                />
              ))}
            </div>
          </AnimatePresence>

          {/* Floating Create Button */}
          <Link href="/assignments/create" className="fixed bottom-8 right-8">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button className="gap-2 rounded-xl bg-neutral-900 px-5 shadow-lg text-white hover:bg-neutral-800">
                <Plus className="h-4 w-4" />
                Create Assignment
              </Button>
            </motion.div>
          </Link>
        </>
      )}
    </div>
  );
}
