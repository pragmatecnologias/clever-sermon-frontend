type Props = {
  isActive: boolean
  isExpanded: boolean
  selectionLoading: boolean
  onSelect: () => void
  onToggleExpand: () => void
  onEdit: () => void
  outlineType?: string
}

export default function WorkspaceOutlineControls({
  isActive,
  isExpanded,
  selectionLoading,
  onSelect,
  onToggleExpand,
  onEdit,
  outlineType,
}: Props) {
  return (
    <div className="flex items-center gap-2 flex-wrap justify-end">
      <button
        onClick={onSelect}
        disabled={isActive || selectionLoading}
        className="cyber-outline px-3 py-1 text-xs rounded-full disabled:opacity-60"
      >
        {isActive ? 'Active' : selectionLoading ? 'Activating...' : 'Make Active'}
      </button>
      <button onClick={onToggleExpand} className="cyber-outline px-3 py-1 text-xs rounded-full">
        {isExpanded ? 'Collapse' : 'Expand'}
      </button>
      <button onClick={onEdit} className="cyber-outline px-3 py-1 text-xs rounded-full">
        Edit
      </button>
      {outlineType ? (
        <span className="text-[10px] px-2 py-1 rounded-full border border-white/20 text-gray-200/90 uppercase">
          {outlineType}
        </span>
      ) : null}
    </div>
  )
}

