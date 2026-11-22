/**
 * UYCHI PARRANDA - Parrandachilik Fabrikasi Boshqaruv Tizimi
 * Main Application Component
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { MilestoneAlertModal } from './components/common/MilestoneAlertModal';
import { AttendanceModal } from './components/common/AttendanceModal';
import { PhotoUploadModal } from './components/common/PhotoUploadModal';
import { RecurringAlertBanner } from './components/common/RecurringAlertBanner';
import { GeneralChat } from './components/common/GeneralChat';
import { VoiceAssistantWidget } from './components/common/VoiceAssistantWidget';
import { BottomNavBar } from './components/common/BottomNavBar';
import { QuickWorkerBar } from './components/common/QuickWorkerBar';

// Role Dashboards
import { DirectorDashboard } from './components/roles/DirectorDashboard';
import { HrDashboard } from './components/roles/HrDashboard';
import { StatisticianDashboard } from './components/roles/StatisticianDashboard';
import { FarmManagerDashboard } from './components/roles/FarmManagerDashboard';
import { VeterinarianDashboard } from './components/roles/VeterinarianDashboard';
import { ElectricianDashboard } from './components/roles/ElectricianDashboard';
import { SlesarDashboard } from './components/roles/SlesarDashboard';
import { EggDriverDashboard } from './components/roles/EggDriverDashboard';
import { FeedDriverDashboard } from './components/roles/FeedDriverDashboard';
import { GuardDashboard } from './components/roles/GuardDashboard';
import { CookDashboard } from './components/roles/CookDashboard';
import { SanitationDashboard } from './components/roles/SanitationDashboard';

// Shared Views
import { TasksView } from './components/views/TasksView';
import { AttendanceView } from './components/views/AttendanceView';
import { PhotoReportsView } from './components/views/PhotoReportsView';
import { NotesView } from './components/views/NotesView';
import { BranchAnalyticsView } from './components/views/BranchAnalyticsView';
import { BranchOperationalPlanView } from './components/views/BranchOperationalPlanView';
import { BranchInventoryView } from './components/views/BranchInventoryView';
import { ChickenWeightView } from './components/views/ChickenWeightView';
import { AuthGateModal } from './components/common/AuthGateModal';
import { SplashIntro } from './components/common/SplashIntro';

const MainLayout: React.FC = () => {
  const { currentUser, activeTab } = useApp();
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
  const [isPhotoUploadOpen, setIsPhotoUploadOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  // Render role-specific dashboard
  const renderRoleDashboard = () => {
    switch (currentUser.role) {
      case 'direktor':
        return <DirectorDashboard />;
      case 'kadrlar':
        return <HrDashboard />;
      case 'statistikachi':
        return <StatisticianDashboard />;
      case 'ish_boshqaruvchi':
        return <FarmManagerDashboard />;
      case 'veterinar':
        return <VeterinarianDashboard />;
      case 'elektrik':
        return <ElectricianDashboard />;
      case 'slesar':
        return <SlesarDashboard />;
      case 'eltuvchi_tuxum':
        return <EggDriverDashboard />;
      case 'yem_tashuvchi':
        return <FeedDriverDashboard />;
      case 'qorovul':
        return <GuardDashboard />;
      case 'oshpaz':
        return <CookDashboard />;
      case 'tozalik_masuli':
        return <SanitationDashboard />;
      default:
        return <DirectorDashboard />;
    }
  };

  // Render active tab with strict role boundaries
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderRoleDashboard();
      case 'operational_plan':
        // Har bir filial uchun Kundalik Operativ Reja moduli
        return <BranchOperationalPlanView />;
      case 'branch_analytics':
        // Filiallar analitikasi
        return <BranchAnalyticsView />;
      case 'inventory':
        // Filiallar inventarizatsiyasi (yem, dori, asbob-uskunalar)
        return <BranchInventoryView />;
      case 'chicken_weight':
        // Parrandalar vazni
        return <ChickenWeightView />;
      case 'chat':
        return <GeneralChat />;
      case 'photos':
        return <PhotoReportsView onOpenUpload={() => setIsPhotoUploadOpen(true)} />;
      case 'tasks':
        return <TasksView />;
      case 'attendance':
        return <AttendanceView onOpenAttendanceModal={() => setIsAttendanceOpen(true)} />;
      case 'notes':
        return <NotesView />;
      case 'hr':
        if (currentUser.role === 'kadrlar' || currentUser.role === 'direktor') {
          return <HrDashboard />;
        }
        return renderRoleDashboard();

      default:
        return renderRoleDashboard();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif] selection:bg-amber-500 selection:text-slate-950">
      {showSplash && <SplashIntro onEnter={() => setShowSplash(false)} />}

      {/* Universal Farm Header */}
      <Header
        onOpenAttendance={() => setIsAttendanceOpen(true)}
        onOpenPhotoUpload={() => setIsPhotoUploadOpen(true)}
      />

      {/* 3-Minute Recurring Audio Alarm & Urgent Task Banner */}
      <RecurringAlertBanner />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 space-y-5 pb-24 md:pb-8">
        {/* Tezkor ish boshqaruv paneli (Davomat, Reja, Foto hisobot) */}
        <QuickWorkerBar
          onOpenAttendance={() => setIsAttendanceOpen(true)}
          onOpenPhotoUpload={() => setIsPhotoUploadOpen(true)}
        />

        {renderContent()}
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-900 bg-slate-950/80 text-center text-xs text-slate-500 mb-14 md:mb-0">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400">UYCHI PARRANDA</span>
            <span>•</span>
            <span>Parrandachilik Fabrikasi Korxona Tizimi</span>
          </div>
          <div className="text-[11px] text-slate-600">
            Avtomatlashtirilgan davomat, 12 ta rol (Kadrlar HR bo'limi), shaxsiy zametkalar va 3 daqiqalik ogohlantirish audiosi
          </div>
        </div>
      </footer>

      {/* 1-marta kirish tekshiruvi: Lavozim va Ism-familiya */}
      <AuthGateModal />

      {/* Global Modals & Slesar Milestone Alarm */}
      <MilestoneAlertModal />
      <AttendanceModal
        isOpen={isAttendanceOpen}
        onClose={() => setIsAttendanceOpen(false)}
      />
      <PhotoUploadModal
        isOpen={isPhotoUploadOpen}
        onClose={() => setIsPhotoUploadOpen(false)}
      />

      {/* Web Speech API Voice Assistant & Voice Reminders Widget */}
      <VoiceAssistantWidget
        onOpenAttendance={() => setIsAttendanceOpen(true)}
        onOpenPhotoUpload={() => setIsPhotoUploadOpen(true)}
      />

      {/* Pastki Qulay Mobil Navigatsiya (Bottom Navigation Bar) */}
      <BottomNavBar
        onOpenAttendance={() => setIsAttendanceOpen(true)}
        onOpenPhotoUpload={() => setIsPhotoUploadOpen(true)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
