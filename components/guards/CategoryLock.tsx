type Props = {
  isLocked: boolean;
  children: React.ReactNode;
};

export default function CategoryLock({ isLocked, children }: Props) {
  if (isLocked) {
    return (
      <div className="bg-red-100 p-3 border border-red-300 rounded text-sm text-red-700 text-center mt-2">
        🔒 This category is soft-locked. You've overspent on multiple days this month.
      </div>
    );
  }

  return <>{children}</>;
}
