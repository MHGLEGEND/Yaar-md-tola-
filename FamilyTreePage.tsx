'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { familyApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { FiSearch, FiPlus, FiZoomIn, FiZoomOut, FiMaximize, FiX, FiUser } from 'react-icons/fi';

interface Member {
  id: string; name: string; branch: string; generation: number;
  gender: string; photo?: string; profession?: string;
  isAlive: boolean; children?: Member[]; fatherId?: string;
}

const BRANCH_COLORS: Record<string, string> = {
  ABU_SHEIKH: '#6366f1', GUMANI_SHEIKH: '#10b981', KALIMUDDIN_HAJI: '#f59e0b',
  HAJRAT_ALI: '#ef4444', AFSAR_SHEIKH: '#8b5cf6', JOHORDI_SHEIKH: '#06b6d4',
  ZHURU_SAMAD: '#f97316', UNASSIGNED: '#6b7280',
};

export default function FamilyTreePage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  const { data: treeData, isLoading } = useQuery({
    queryKey: ['family-tree'],
    queryFn: () => familyApi.getTree().then(r => r.data.data),
  });

  const { data: searchResults } = useQuery({
    queryKey: ['family-search', searchTerm],
    queryFn: () => searchTerm.length >= 2 ? familyApi.search(searchTerm).then(r => r.data.data) : [],
    enabled: searchTerm.length >= 2,
  });

  const { data: memberDetail } = useQuery({
    queryKey: ['family-member', selectedMember?.id],
    queryFn: () => familyApi.getMember(selectedMember!.id).then(r => r.data.data),
    enabled: !!selectedMember?.id,
  });

  // Build flat list for rendering
  const flattenTree = (nodes: Member[], depth = 0): { member: Member; depth: number; index: number }[] => {
    const result: any[] = [];
    nodes.forEach((node, i) => {
      result.push({ member: node, depth, index: i });
      if (node.children?.length) result.push(...flattenTree(node.children, depth + 1));
    });
    return result;
  };

  const roots = treeData?.roots || [];
  const flatMembers = flattenTree(roots);

  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input className="input pl-9 text-sm" placeholder="Search family members..." value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)} />
          {searchTerm && searchResults && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 z-50 max-h-48 overflow-y-auto">
              {searchResults.map((m: any) => (
                <button key={m.id} onClick={() => { setSelectedMember(m); setSearchTerm(''); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 text-left">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ background: BRANCH_COLORS[m.branch] || '#6b7280' }}>{m.name[0]}</div>
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{m.name}</div>
                    <div className="text-xs text-gray-400">Gen {m.generation} · {m.branch?.replace(/_/g, ' ')}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary py-2 px-3 text-sm flex items-center gap-1.5">
          <FiPlus className="w-4 h-4" /> Add
        </button>
      </div>

      {/* Branch Legend */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(BRANCH_COLORS).filter(([k]) => k !== 'UNASSIGNED').map(([branch, color]) => (
          <span key={branch} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
            <span className="w-3 h-3 rounded-full inline-block" style={{ background: color }} />
            {branch.replace(/_/g, ' ')}
          </span>
        ))}
      </div>

      {/* Tree visualization */}
      <div className="card overflow-hidden">
        {/* Zoom controls */}
        <div className="flex items-center justify-between p-3 border-b border-gray-100 dark:border-gray-700">
          <span className="text-xs text-gray-500">{treeData?.totalMembers || 0} members · Drag to pan</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setZoom(z => Math.max(0.3, z - 0.2))} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <FiZoomOut className="w-4 h-4 text-gray-500" />
            </button>
            <span className="text-xs text-gray-500 w-10 text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(2, z + 0.2))} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <FiZoomIn className="w-4 h-4 text-gray-500" />
            </button>
            <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <FiMaximize className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-auto" style={{ height: '500px' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={() => setDragging(false)}
            onMouseLeave={() => setDragging(false)}>
            <div style={{ transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`, transformOrigin: 'top left', transition: dragging ? 'none' : 'transform 0.15s ease', padding: '24px', minWidth: '800px' }}>
              <TreeNode members={roots} onSelect={setSelectedMember} selectedId={selectedMember?.id} userId={user?.familyMemberId} />
            </div>
          </div>
        )}
      </div>

      {/* Member Detail Panel */}
      {selectedMember && (
        <div className="card p-5 animate-slide-up">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-xl"
                style={{ background: BRANCH_COLORS[selectedMember.branch] || '#6b7280' }}>
                {selectedMember.photo ? <img src={selectedMember.photo} className="w-14 h-14 rounded-xl object-cover" alt="" /> : selectedMember.name[0]}
              </div>
              <div>
                <h2 className="font-bold text-gray-900 dark:text-white text-lg">{selectedMember.name}</h2>
                <div className="flex gap-2 flex-wrap mt-1">
                  <span className="badge-blue">Gen {selectedMember.generation}</span>
                  <span className="badge" style={{ background: BRANCH_COLORS[selectedMember.branch] + '20', color: BRANCH_COLORS[selectedMember.branch] }}>
                    {selectedMember.branch?.replace(/_/g, ' ')}
                  </span>
                  <span className={selectedMember.isAlive ? 'badge-green' : 'badge-gray'}>
                    {selectedMember.isAlive ? '✓ Living' : '✦ Deceased'}
                  </span>
                </div>
              </div>
            </div>
            <button onClick={() => setSelectedMember(null)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <FiX className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {memberDetail && (
            <div className="grid grid-cols-2 gap-3 text-sm">
              {memberDetail.father && <InfoRow label="Father" value={memberDetail.father.name} />}
              {memberDetail.mother && <InfoRow label="Mother" value={memberDetail.mother.name} />}
              {memberDetail.spouse && <InfoRow label="Spouse" value={memberDetail.spouse.name} />}
              {memberDetail.profession && <InfoRow label="Profession" value={memberDetail.profession} />}
              {memberDetail.dob && <InfoRow label="Born" value={new Date(memberDetail.dob).getFullYear().toString()} />}
              {memberDetail.descendantCount !== undefined && <InfoRow label="Descendants" value={memberDetail.descendantCount.toString()} />}
              {memberDetail.children?.length > 0 && (
                <div className="col-span-2">
                  <div className="text-gray-400 text-xs mb-1">Children ({memberDetail.children.length})</div>
                  <div className="flex flex-wrap gap-1.5">
                    {memberDetail.children.map((c: any) => (
                      <button key={c.id} onClick={() => setSelectedMember(c)}
                        className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-700 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-primary-100 dark:hover:bg-primary-900/30">
                        <FiUser className="w-3 h-3" />{c.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {showAddModal && <AddMemberModal onClose={() => setShowAddModal(false)} />}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
      <div className="text-xs text-gray-400">{label}</div>
      <div className="font-medium text-gray-900 dark:text-white">{value}</div>
    </div>
  );
}

function TreeNode({ members, onSelect, selectedId, userId, depth = 0 }: {
  members: Member[]; onSelect: (m: Member) => void;
  selectedId?: string; userId?: string; depth?: number;
}) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const BRANCH_COLORS: Record<string, string> = {
    ABU_SHEIKH: '#6366f1', GUMANI_SHEIKH: '#10b981', KALIMUDDIN_HAJI: '#f59e0b',
    HAJRAT_ALI: '#ef4444', AFSAR_SHEIKH: '#8b5cf6', JOHORDI_SHEIKH: '#06b6d4',
    ZHURU_SAMAD: '#f97316', UNASSIGNED: '#6b7280',
  };

  return (
    <div className={`flex ${depth === 0 ? 'flex-col items-center' : 'flex-col items-center'} gap-0`}>
      {members.map((member, idx) => (
        <div key={member.id} className="flex flex-col items-center">
          {/* Connector line from parent */}
          {depth > 0 && <div className="w-0.5 h-6 bg-gray-300 dark:bg-gray-600" />}

          {/* Member card */}
          <div className={`relative flex flex-col items-center`}>
            <div onClick={() => onSelect(member)}
              className={`tree-node-card ${selectedId === member.id ? 'active' : ''} ${member.id === userId ? 'ring-2 ring-gold-400' : ''}`}
              style={{ borderColor: selectedId === member.id ? BRANCH_COLORS[member.branch] : undefined }}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ background: BRANCH_COLORS[member.branch] || '#6b7280' }}>
                  {member.photo ? <img src={member.photo} className="w-8 h-8 rounded-full object-cover" alt="" /> : member.name[0]}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-gray-900 dark:text-white truncate leading-tight">{member.name}</div>
                  {member.profession && <div className="text-[10px] text-gray-400 truncate">{member.profession}</div>}
                </div>
              </div>
              {!member.isAlive && <div className="absolute -top-1 -right-1 w-3 h-3 bg-gray-400 rounded-full border border-white text-[8px] flex items-center justify-center text-white">✦</div>}
            </div>

            {/* Collapse/expand button */}
            {member.children && member.children.length > 0 && (
              <button onClick={(e) => { e.stopPropagation(); setCollapsed(c => ({ ...c, [member.id]: !c[member.id] })); }}
                className="mt-1 w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 text-xs font-bold flex items-center justify-center hover:bg-primary-200 z-10">
                {collapsed[member.id] ? `+${member.children.length}` : '−'}
              </button>
            )}
          </div>

          {/* Children */}
          {member.children && member.children.length > 0 && !collapsed[member.id] && (
            <div className="flex flex-col items-center">
              <div className="w-0.5 h-4 bg-gray-300 dark:bg-gray-600" />
              <div className="flex items-start gap-4 relative">
                {/* Horizontal connector */}
                {member.children.length > 1 && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 bg-gray-300 dark:bg-gray-600"
                    style={{ width: `${(member.children.length - 1) * 196}px` }} />
                )}
                {member.children.map(child => (
                  <TreeNode key={child.id} members={[child]} onSelect={onSelect} selectedId={selectedId} userId={userId} depth={depth + 1} />
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function AddMemberModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: '', relationType: 'SON', relativeId: '', gender: 'MALE', profession: '', dob: '' });
  const [loading, setLoading] = useState(false);
  const { data: searchData } = useQuery({
    queryKey: ['family-search-modal', form.relativeId],
    queryFn: () => form.relativeId.length >= 2 ? familyApi.search(form.relativeId).then(r => r.data.data) : [],
    enabled: form.relativeId.length >= 2,
  });

  const submit = async () => {
    if (!form.name) { toast.error('Name required'); return; }
    setLoading(true);
    try {
      await familyApi.requestAddMember({ relationType: form.relationType, newMemberData: form });
      toast.success('Request submitted for admin approval!');
      qc.invalidateQueries({ queryKey: ['family-tree'] });
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit request');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="card w-full max-w-md p-5 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Request: Add Family Member</h2>
          <button onClick={onClose}><FiX className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Full Name *</label>
            <input className="input text-sm" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Member's full name" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Relation Type *</label>
              <select className="input text-sm" value={form.relationType} onChange={e => setForm(f => ({ ...f, relationType: e.target.value }))}>
                {['FATHER','MOTHER','SON','DAUGHTER','BROTHER','SISTER','SPOUSE','GRANDFATHER'].map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Gender</label>
              <select className="input text-sm" value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}>
                <option value="MALE">Male</option><option value="FEMALE">Female</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Profession</label>
            <input className="input text-sm" value={form.profession} onChange={e => setForm(f => ({ ...f, profession: e.target.value }))} placeholder="e.g. Farmer, Teacher..." />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Year of Birth</label>
            <input className="input text-sm" type="number" value={form.dob} onChange={e => setForm(f => ({ ...f, dob: e.target.value }))} placeholder="e.g. 1965" />
          </div>
          <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2.5 rounded-lg">
            ⚠️ Your request will be reviewed by an admin before being added to the family tree.
          </p>
          <button onClick={submit} disabled={loading} className="btn-primary w-full">
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </div>
    </div>
  );
}
