'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';

interface Node { id: string; name: string; nodeType: string; children: Node[]; _count: { files: number; tours: number } }
interface File { id: string; name: string; fileType: string; sizeBytes: string; createdAt: string }
interface Project { id: string; name: string; sector: string | null; structureType: string }

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    Promise.all([
      apiClient.get(`/api/projects/${id}`),
      apiClient.get(`/api/projects/${id}/nodes`),
    ]).then(([pRes, nRes]) => {
      setProject(pRes.data.data);
      setNodes(nRes.data.data ?? []);
    }).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedNodeId) params.set('nodeId', selectedNodeId);
    apiClient.get(`/api/projects/${id}/files?${params}`).then((r) => {
      setFiles(r.data.files ?? []);
    });
  }, [id, selectedNodeId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    if (selectedNodeId) formData.append('nodeId', selectedNodeId);
    try {
      await apiClient.post(`/api/projects/${id}/files`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const r = await apiClient.get(`/api/projects/${id}/files${selectedNodeId ? `?nodeId=${selectedNodeId}` : ''}`);
      setFiles(r.data.files ?? []);
    } catch (err: any) {
      alert(err.response?.data?.error?.message ?? 'Erreur upload');
    } finally {
      setUploading(false);
    }
  };

  const renderNode = (node: Node, depth = 0) => (
    <div key={node.id}>
      <button
        onClick={() => setSelectedNodeId(node.id === selectedNodeId ? null : node.id)}
        className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors ${
          selectedNodeId === node.id ? 'bg-primary-100 text-primary-700 font-medium' : 'hover:bg-gray-100 text-gray-700'
        }`}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
      >
        <span>{node.nodeType === 'floor' ? '🏠' : '🚪'}</span>
        <span className="flex-1">{node.name}</span>
        <span className="text-xs text-gray-400">{node._count.files}f</span>
      </button>
      {node.children?.map((child) => renderNode(child, depth + 1))}
    </div>
  );

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-gray-500">Chargement...</div></div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-gray-400 hover:text-gray-600">←</Link>
          <div className="w-8 h-8 bg-primary-700 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">B</span>
          </div>
          <span className="font-semibold text-gray-900">{project?.name}</span>
          {project?.sector && (
            <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">{project.sector}</span>
          )}
        </div>
        <label className={`bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium cursor-pointer hover:bg-primary-800 transition-colors ${uploading ? 'opacity-60' : ''}`}>
          {uploading ? 'Upload...' : '+ Ajouter fichier'}
          <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </header>

      <div className="flex flex-1">
        {/* Sidebar — arbre de navigation */}
        <aside className="w-64 bg-white border-r border-gray-200 p-4 flex-shrink-0">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Structure</div>
          <button
            onClick={() => setSelectedNodeId(null)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm mb-1 transition-colors ${!selectedNodeId ? 'bg-primary-100 text-primary-700 font-medium' : 'hover:bg-gray-100 text-gray-700'}`}
          >
            📁 Tous les fichiers
          </button>
          {nodes.map((node) => renderNode(node))}
          {nodes.length === 0 && (
            <p className="text-xs text-gray-400 text-center mt-4">Aucune structure définie</p>
          )}
        </aside>

        {/* Zone principale — fichiers */}
        <main className="flex-1 p-6">
          <div className="mb-4 text-sm text-gray-500">
            {files.length} fichier{files.length !== 1 ? 's' : ''}
            {selectedNodeId && nodes.length > 0 ? ' dans cette pièce' : ' au total'}
          </div>

          {files.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-4xl mb-3">📂</div>
              <p className="text-gray-500">Aucun fichier. Uploadez votre premier fichier.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {files.map((file) => (
                <div key={file.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
                  <div className="text-3xl mb-3 text-center">
                    {file.fileType === 'PDF' ? '📄' : file.fileType === 'IMAGE_360' ? '🌐' : file.fileType?.startsWith('IMAGE') ? '🖼️' : file.fileType === 'VIDEO' ? '🎥' : '📁'}
                  </div>
                  <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {Math.round(Number(file.sizeBytes) / 1024)} Ko
                  </p>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full mt-2 inline-block">
                    {file.fileType}
                  </span>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
