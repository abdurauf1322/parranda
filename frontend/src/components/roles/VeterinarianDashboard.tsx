import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Stethoscope,
  Plus,
  HeartPulse,
  Pill,
  Syringe,
  AlertTriangle,
  Camera,
  CheckCircle2,
  Calendar,
  Sparkles
} from 'lucide-react';

export const VeterinarianDashboard: React.FC = () => {
  const { diagnoses, addDiagnosis, photoReports, createTask } = useApp();

  const [showDiagModal, setShowDiagModal] = useState(false);
  const [building, setBuilding] = useState('1-Bino');
  const [birdAgeWeeks, setBirdAgeWeeks] = useState(38);
  const [symptoms, setSymptoms] = useState('');
  const [diagnosisTitle, setDiagnosisTitle] = useState('');
  const [prescribedTreatment, setPrescribedTreatment] = useState('');
  const [medicationName, setMedicationName] = useState('');
  const [dosage, setDosage] = useState('');
  const [courseDays, setCourseDays] = useState(5);
  const [severity, setSeverity] = useState<'yengil' | 'ortacha' | 'xavfli'>('yengil');

  const handleCreateDiagnosis = (e: React.FormEvent) => {
    e.preventDefault();
    if (!diagnosisTitle.trim() || !symptoms.trim()) return;

    addDiagnosis({
      building,
      birdAgeWeeks: Number(birdAgeWeeks),
      symptoms,
      diagnosis: diagnosisTitle,
      prescribedTreatment,
      medicationName,
      dosage,
      courseDurationDays: Number(courseDays),
      severity,
      status: 'davolanmoqda',
      photoUrl: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=600&q=80',
    });

    // Auto create task for Slesar / Feed dispenser to add medication to water/feed
    createTask({
      title: `Vet dori aralashtirish: ${medicationName} (${building})`,
      description: `Veterinar ko'rsatmasi bo'yicha: ${dosage}. ${prescribedTreatment}`,
      assignedToRole: 'slesar',
      assignedToName: 'Slesar / Yem tarqatuvchi',
      priority: severity === 'xavfli' ? 'yuqori' : 'orta',
      building,
      dueTime: '10:00',
    });

    setShowDiagModal(false);
    setSymptoms('');
    setDiagnosisTitle('');
    setPrescribedTreatment('');
    setMedicationName('');
    setDosage('');
  };

  const vetPhotoReports = photoReports.filter(
    (p) => p.category === 'diagnostika' || p.category === 'sanitariya'
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/40 p-6 rounded-3xl border border-emerald-500/30 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Stethoscope className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white">
                Veterinar Shifokor Paneli
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Parranda Sog'lig'i & Profilaktika
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Kasalliklarni diagnostika qilish, retsept berish va foto-tekshiruv monitoringi
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowDiagModal(true)}
          className="self-start md:self-auto px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Yangi Tashxis & Retsept Yozish</span>
        </button>
      </div>

      {/* Main Grid: Active Diagnoses & Farm Diagnostic Photos */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Active Diagnoses & Treatments (7 cols) */}
        <div className="lg:col-span-7 bg-slate-850 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-emerald-400" />
              <span>Parranda Kasalliklari & Muolaja Ro'yxati</span>
            </h2>
            <span className="text-xs text-slate-400">{diagnoses.length} ta tashxis</span>
          </div>

          <div className="space-y-3">
            {diagnoses.map((diag) => (
              <div
                key={diag.id}
                className="p-4 bg-slate-800/70 border border-slate-700/80 rounded-2xl space-y-3 hover:border-slate-600 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white">{diag.diagnosis}</h3>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          diag.severity === 'xavfli'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : diag.severity === 'ortacha'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {diag.severity === 'xavfli'
                          ? 'Yuqori xavf'
                          : diag.severity === 'ortacha'
                          ? 'O\'rtacha'
                          : 'Yengil'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      <span className="text-slate-300 font-semibold">{diag.building}</span> • Yosh: {diag.birdAgeWeeks} haftalik • Sana: {diag.date}
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      diag.status === 'sogaydi'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {diag.status === 'sogaydi' ? 'Sog\'aydi' : 'Davolanmoqda'}
                  </span>
                </div>

                <div className="text-xs text-slate-300 bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-1">
                  <div>
                    <span className="font-semibold text-slate-400">Alomatlar (Simptomlar):</span> {diag.symptoms}
                  </div>
                  <div>
                    <span className="font-semibold text-emerald-400">Buyurilgan dori vositasi:</span> {diag.medicationName} ({diag.dosage})
                  </div>
                  <div>
                    <span className="font-semibold text-teal-400">Muolaja kursi:</span> {diag.courseDurationDays} kun davomida ({diag.prescribedTreatment})
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <span>Shifokor: {diag.doctorName}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Diagnostic Photo Feed from Farm (5 cols) */}
        <div className="lg:col-span-5 bg-slate-850 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <Camera className="w-4 h-4 text-emerald-400" />
              <span>Sexlardan Tushgan Foto-Lenta</span>
            </h2>
            <span className="text-xs text-slate-400">Veterinar ko'rigi uchun</span>
          </div>

          <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1 scrollbar-thin">
            {vetPhotoReports.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                Hozircha tekshiruv uchun fotosuratlar yo'q
              </div>
            ) : (
              vetPhotoReports.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-2xl flex gap-3 text-xs"
                >
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-24 h-24 rounded-xl object-cover border border-slate-700 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-white truncate">{item.title}</div>
                    <div className="text-[11px] text-emerald-400">{item.building} • {item.timestamp}</div>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{item.notes}</p>
                    <div className="mt-2 text-[10px] text-slate-500">
                      Yuklovchi: {item.uploaderName}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Diagnosis Modal */}
      {showDiagModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Pill className="w-5 h-5 text-emerald-400" />
              <span>Yangi Tibbiy Tashxis & Retsept Yozish</span>
            </h3>

            <form onSubmit={handleCreateDiagnosis} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Bino / Sex:</label>
                  <select
                    value={building}
                    onChange={(e) => setBuilding(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  >
                    <option value="1-Bino">1-Bino (Loman Braun)</option>
                    <option value="2-Bino">2-Bino (Dekalb Oq)</option>
                    <option value="3-Bino">3-Bino (Yosh parranda)</option>
                    <option value="Inkubator">Inkubator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Parranda yoshi (hafta):
                  </label>
                  <input
                    type="number"
                    value={birdAgeWeeks}
                    onChange={(e) => setBirdAgeWeeks(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Kuzatilgan kasallik alomatlari:
                </label>
                <textarea
                  rows={2}
                  required
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="Masalan: Tovuqlarda holsizlik, patlarning to'kilishi, ich ketishi..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Qo'yilgan tashxis (Diagnoz):
                </label>
                <input
                  type="text"
                  required
                  value={diagnosisTitle}
                  onChange={(e) => setDiagnosisTitle(e.target.value)}
                  placeholder="Masalan: Gipovitaminoz D3 yoki Yengil Enterit"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Dori yoki preparat nomi:
                  </label>
                  <input
                    type="text"
                    required
                    value={medicationName}
                    onChange={(e) => setMedicationName(e.target.value)}
                    placeholder="Masalan: Aminovital + Enrofloksatsin"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Doza va konsentratsiya:
                  </label>
                  <input
                    type="text"
                    required
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    placeholder="Masalan: 1 litr / 1000 litr suvga"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Muolaja davomiyligi (kun):
                  </label>
                  <input
                    type="number"
                    value={courseDays}
                    onChange={(e) => setCourseDays(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Xavflilik darajasi:</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  >
                    <option value="yengil">Yengil (Profilaktika)</option>
                    <option value="ortacha">O'rtacha</option>
                    <option value="xavfli">Xavfli (Karantin / Zudlik bilan)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Muolaja va parhez ko'rsatmasi:
                </label>
                <textarea
                  rows={2}
                  value={prescribedTreatment}
                  onChange={(e) => setPrescribedTreatment(e.target.value)}
                  placeholder="Slesar va yemchilarga aralashtirish tartibi..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDiagModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold"
                >
                  Tashxisni Tasdiqlash & Slesarga Topshiriq Berish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
