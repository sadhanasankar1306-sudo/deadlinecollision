import React, { useState, useRef } from 'react';
import {
  Settings,
  Save,
  RotateCcw,
  Trash2,
  Download,
  Upload,
  Check,
  User,
  Clock,
  ShieldAlert,
  Bell,
  Sliders,
  AlertTriangle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserSettings } from '../types';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    resetToDemoData,
    clearAllTasks,
    exportDataJson,
    importDataJson,
  } = useApp();

  const [form, setForm] = useState<UserSettings>({ ...settings });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(form);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const toggleWorkingDay = (day: number) => {
    setForm((prev) => {
      const next = prev.workingDays.includes(day)
        ? prev.workingDays.filter((d) => d !== day)
        : [...prev.workingDays, day].sort();
      return {
        ...prev,
        workingDays: next.length > 0 ? next : prev.workingDays,
      };
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importDataJson(content);
      if (success) {
        setImportStatus('Backup successfully imported!');
      } else {
        setImportStatus('Failed to parse valid backup JSON file.');
      }
      setTimeout(() => setImportStatus(null), 3000);
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">System Settings</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure working hours, collision sensitivity heuristics, date formatting, and data backups.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-2xs transition-colors self-start sm:self-auto cursor-pointer"
        >
          {saveSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          <span>{saveSuccess ? 'Saved Changes' : 'Save Preferences'}</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* User Profile Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
            <User className="w-4 h-4 text-blue-600" /> User Profile & Identity
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Display Name</label>
              <input
                type="text"
                value={form.userName}
                onChange={(e) => setForm({ ...form, userName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Academic / Job Role</label>
              <input
                type="text"
                value={form.userRole}
                onChange={(e) => setForm({ ...form, userRole: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
        </div>

        {/* Working Hours & Capacity */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
            <Clock className="w-4 h-4 text-blue-600" /> Study & Working Capacity Limits
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Daily Working Capacity (Hours)
              </label>
              <input
                type="number"
                min="1"
                max="16"
                step="0.5"
                value={form.dailyWorkingHours}
                onChange={(e) =>
                  setForm({ ...form, dailyWorkingHours: parseFloat(e.target.value) || 6 })
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Standard focus capacity per study day
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Workday Start</label>
              <input
                type="time"
                value={form.workdayStart}
                onChange={(e) => setForm({ ...form, workdayStart: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Workday End</label>
              <input
                type="time"
                value={form.workdayEnd}
                onChange={(e) => setForm({ ...form, workdayEnd: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Working Days */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Working Days Selection
            </label>
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { day: 1, label: 'Monday' },
                { day: 2, label: 'Tuesday' },
                { day: 3, label: 'Wednesday' },
                { day: 4, label: 'Thursday' },
                { day: 5, label: 'Friday' },
                { day: 6, label: 'Saturday' },
                { day: 0, label: 'Sunday' },
              ].map(({ day, label }) => {
                const isActive = form.workingDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleWorkingDay(day)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Collision Detection Sensitivity Heuristics */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
            <ShieldAlert className="w-4 h-4 text-red-600" /> Collision Detection Thresholds
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Horizon Window (Days)
              </label>
              <input
                type="number"
                min="3"
                max="60"
                value={form.warningWindowDays}
                onChange={(e) =>
                  setForm({ ...form, warningWindowDays: parseInt(e.target.value) || 14 })
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Lookahead span for collision scan
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Cluster Window (Hours)
              </label>
              <input
                type="number"
                min="6"
                max="72"
                step="6"
                value={form.clusterWindowHours}
                onChange={(e) =>
                  setForm({ ...form, clusterWindowHours: parseInt(e.target.value) || 24 })
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Max span defining a concurrent cluster
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Deadline Buffer (Hours)
              </label>
              <input
                type="number"
                min="0"
                max="12"
                value={form.bufferTime}
                onChange={(e) => setForm({ ...form, bufferTime: parseInt(e.target.value) || 2 })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Buffer period prior to deadline
              </span>
            </div>
          </div>
        </div>

        {/* Notifications & Formatting */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
            <Bell className="w-4 h-4 text-blue-600" /> Notification & Date Formats
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Date Format</label>
              <select
                value={form.dateFormat}
                onChange={(e) => setForm({ ...form, dateFormat: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
              >
                <option value="YYYY-MM-DD">YYYY-MM-DD (ISO standard)</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY (US standard)</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY (International)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Time Format</label>
              <select
                value={form.timeFormat}
                onChange={(e) => setForm({ ...form, timeFormat: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
              >
                <option value="12h">12-Hour format (e.g. 5:00 PM)</option>
                <option value="24h">24-Hour format (e.g. 17:00)</option>
              </select>
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 text-xs text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={form.reminderPreferences.inAppAlerts}
                onChange={(e) =>
                  setForm({
                    ...form,
                    reminderPreferences: {
                      ...form.reminderPreferences,
                      inAppAlerts: e.target.checked,
                    },
                  })
                }
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="font-medium">
                Enable In-App Collision Alerts & Milestone Banners
              </span>
            </label>
          </div>
        </div>

        {/* Data Persistence, Demo Data & Backup Management */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
            Data Repository & Backup Management
          </h3>

          {importStatus && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800 font-medium">
              {importStatus}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={exportDataJson}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Complete JSON Backup</span>
            </button>

            <label className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Import JSON Backup</span>
              <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <button
              type="button"
              onClick={resetToDemoData}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restore Demo Tasks</span>
            </button>

            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All Tasks</span>
            </button>
          </div>
        </div>
      </form>

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200 p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-slate-900">Clear All Tasks & Schedule?</h3>
                <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                  This will remove all tasks and generated schedules from localStorage. You can restore the sample tasks at any time.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  clearAllTasks();
                  setShowClearConfirm(false);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-2xs transition-colors"
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
