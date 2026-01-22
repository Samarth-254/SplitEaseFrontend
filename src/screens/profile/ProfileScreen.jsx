import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Mail, 
  LogOut, 
  Camera,
  Edit2,
  Check,
  X,
  Phone,
  Trash2,
  Upload,
  ChevronRight,
  Bell
} from 'lucide-react';
import ReactGA from 'react-ga4';
import { Screen, PageTitle } from '../../components/layout';
import { Button, Card, Avatar, Modal } from '../../components/ui';
import { useStore } from '../../store/useStore';
import pushNotificationService from '../../services/pushNotification';

/**
 * Profile Screen - Complete with Skeleton Loading
 */

// ✅ SKELETON LOADER COMPONENT
const ProfileSkeletonLoader = () => {
  return (
    <Screen>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Profile Header Skeleton */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
          <div className="pt-8 pb-6 text-center">
            <div className="w-28 h-28 rounded-full bg-neutral-800 animate-pulse mx-auto mb-4 border-4 border-primary-800"></div>
            <div className="h-7 w-40 bg-neutral-800 rounded-lg animate-pulse mx-auto mb-2"></div>
            <div className="h-4 w-48 bg-neutral-800 rounded animate-pulse mx-auto"></div>
          </div>
        </div>

        {/* Personal Information Section Skeleton */}
        <div>
          <div className="h-4 w-40 bg-neutral-800 rounded animate-pulse mb-3"></div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl divide-y divide-neutral-800">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-4">
                <div className="h-3 w-24 bg-neutral-800 rounded animate-pulse mb-3"></div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-neutral-800 rounded animate-pulse"></div>
                  <div className="h-5 w-32 bg-neutral-800 rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notifications Section Skeleton */}
        <div>
          <div className="h-4 w-32 bg-neutral-800 rounded animate-pulse mb-3"></div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-neutral-800 rounded-lg animate-pulse"></div>
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-neutral-800 rounded animate-pulse"></div>
                  <div className="h-3 w-40 bg-neutral-800 rounded animate-pulse"></div>
                </div>
              </div>
              <div className="w-12 h-7 bg-neutral-800 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Account Actions Skeleton */}
        <div>
          <div className="h-4 w-24 bg-neutral-800 rounded animate-pulse mb-3"></div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-neutral-800 rounded-lg animate-pulse"></div>
                <div className="h-5 w-24 bg-neutral-800 rounded animate-pulse"></div>
              </div>
              <div className="w-5 h-5 bg-neutral-800 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </Screen>
  );
};

export const ProfileScreen = () => {
  const navigate = useNavigate();
  const { 
    currentUser, 
    logout, 
    updateProfile, 
    deleteProfileImage,
    isInitialLoadComplete 
  } = useStore();

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [editName, setEditName] = useState(currentUser?.name || '');
  const [mobile, setMobile] = useState(currentUser?.mobile || '');
  const [gender, setGender] = useState(currentUser?.gender || '');
  const [uploading, setUploading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [togglingNotifications, setTogglingNotifications] = useState(false);

  // ✅ ALL HOOKS MUST BE CALLED BEFORE ANY EARLY RETURN

  // ✅ Predefined avatars array (not a hook)
  const predefinedAvatars = [
    '/avatars/female-brown-box.png',
    '/avatars/female-brown-cap.png',
    '/avatars/female-brown-controller.png',
    '/avatars/female-brown-laptop.png',
    '/avatars/female-brown-phone.png',
    '/avatars/female-white-box.png',
    '/avatars/female-white-cap.png',
    '/avatars/female-white-controller.png',
    '/avatars/female-white-laptop.png',
    '/avatars/female-white-phone.png',
    '/avatars/male-brown-box.png',
    '/avatars/male-brown-cap.png',
    '/avatars/male-brown-controller.png',
    '/avatars/male-brown-laptop.png',
    '/avatars/male-brown-phone.png',
    '/avatars/male-white-box.png',
    '/avatars/male-white-cap.png',
    '/avatars/male-white-controller.png',
    '/avatars/male-white-laptop.png',
    '/avatars/male-white-phone.png',
  ];

  // ✅ useEffect #1: Sync local state with currentUser
  useEffect(() => {
    if (currentUser) {
      setEditName(currentUser.name || '');
      setMobile(currentUser.mobile || '');
      setGender(currentUser.gender || '');
    }
  }, [currentUser]);

  // ✅ useEffect #2: Notification status check
  useEffect(() => {
    const checkNotificationStatus = () => {
      setNotificationsEnabled(pushNotificationService.isSubscribed());
    };

    checkNotificationStatus();

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkNotificationStatus();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // ✅ NOW CHECK LOADING STATE - AFTER ALL HOOKS
  const isLoading = !isInitialLoadComplete;
  
  if (isLoading) {
    return <ProfileSkeletonLoader />;
  }

  // ✅ Handler functions (after early return is safe - these are not hooks)
  const handleLogout = () => {
    ReactGA.event({
      category: 'User',
      action: 'Logged Out'
    });
    
    logout();
    navigate('/login');
  };

  const handleNameUpdate = async () => {
    if (editName.trim() && editName !== currentUser?.name) {
      await updateProfile({ name: editName });
      
      ReactGA.event({
        category: 'Profile',
        action: 'Updated Name'
      });
      
      setEditingField(null);
    } else {
      setEditName(currentUser?.name || '');
      setEditingField(null);
    }
  };

  const handleMobileChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 10) {
      setMobile(value);
    }
  };

  const handleMobileUpdate = async () => {
    if (mobile !== currentUser?.mobile) {
      await updateProfile({ mobile });
      
      ReactGA.event({
        category: 'Profile',
        action: 'Updated Mobile'
      });
      
      setEditingField(null);
    } else {
      setMobile(currentUser?.mobile || '');
      setEditingField(null);
    }
  };

  const handleGenderUpdate = async (newGender) => {
    setGender(newGender);
    await updateProfile({ gender: newGender });
    
    ReactGA.event({
      category: 'Profile',
      action: 'Updated Gender',
      label: newGender
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      setUploading(true);
      const formData = new FormData();
      formData.append('profileImage', file);
      await updateProfile(formData);
      
      ReactGA.event({
        category: 'Profile',
        action: 'Uploaded Custom Avatar'
      });
      
      setUploading(false);
      setShowAvatarPicker(false);
    }
  };

  const handleAvatarSelect = async (avatarUrl) => {
    setUploading(true);
    await updateProfile({ profileImage: avatarUrl });
    
    ReactGA.event({
      category: 'Profile',
      action: 'Selected Predefined Avatar'
    });
    
    setUploading(false);
    setShowAvatarPicker(false);
  };

  const handleDeleteImage = async () => {
    await deleteProfileImage();
    
    ReactGA.event({
      category: 'Profile',
      action: 'Deleted Avatar'
    });
    
    setShowDeleteConfirm(false);
  };

  const handleToggleNotifications = async () => {
    if (togglingNotifications) return;

    setTogglingNotifications(true);
    
    if (notificationsEnabled) {
      await pushNotificationService.unsubscribe();
      setNotificationsEnabled(false);
      
      ReactGA.event({
        category: 'Notification',
        action: 'Disabled from Profile'
      });
    } else {
      const granted = await pushNotificationService.requestPermission();
      setNotificationsEnabled(granted);
      
      if (granted) {
        ReactGA.event({
          category: 'Notification',
          action: 'Enabled from Profile'
        });
      } else {
        ReactGA.event({
          category: 'Notification',
          action: 'Denied from Profile'
        });
      }
    }
    
    setTogglingNotifications(false);
  };

  return (
    <Screen>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Profile Header */}
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-secondary-500/10 via-transparent to-primary-900 pointer-events-none" />
          
          <div className="relative pt-8 pb-6 text-center">
            <div className="relative inline-block mb-4">
              {currentUser?.profileImage ? (
                <img 
                  src={currentUser.profileImage} 
                  alt="Profile" 
                  className="w-28 h-28 rounded-full object-cover mx-auto border-4 border-primary-800 shadow-xl"
                />
              ) : (
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-secondary-600 to-secondary-700 flex items-center justify-center mx-auto border-4 border-primary-800 shadow-xl text-4xl text-white font-bold">
                  {currentUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
              
              <button
                onClick={() => {
                  setShowAvatarPicker(true);
                  ReactGA.event({
                    category: 'Profile',
                    action: 'Opened Avatar Picker'
                  });
                }}
                disabled={uploading}
                className="absolute bottom-0 right-0 p-2.5 rounded-full bg-secondary-500 hover:bg-secondary-600 transition-all shadow-lg hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <Camera size={18} className="text-white" />
                )}
              </button>

              {currentUser?.profileImage && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="absolute top-0 left-0 p-2 rounded-full bg-red-500/90 hover:bg-red-600 transition-all shadow-lg hover:scale-110"
                >
                  <Trash2 size={16} className="text-white" />
                </button>
              )}
            </div>

            <h2 className="text-2xl font-bold text-white mb-1">
              {currentUser?.name || 'User'}
            </h2>
            <p className="text-neutral-400 text-sm">
              {currentUser?.email || 'user@example.com'}
            </p>
          </div>
        </Card>

        {/* Personal Information Section */}
        <div>
          <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-3 px-1">
            Personal Information
          </h3>
          <Card className="divide-y divide-neutral-800">
            {/* Name Field */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Full Name
                </label>
                {editingField !== 'name' && (
                  <button
                    onClick={() => {
                      setEditingField('name');
                      setEditName(currentUser?.name || '');
                    }}
                    className="text-secondary-500 hover:text-secondary-400 transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                )}
              </div>
              
              <AnimatePresence mode="wait">
                {editingField === 'name' ? (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex gap-2"
                  >
                    <div className="relative flex-1">
                      <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleNameUpdate()}
                        autoFocus
                        className="w-full bg-primary-900 border border-neutral-700 rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-secondary-500 transition-colors"
                        placeholder="Your name"
                      />
                    </div>
                    <button
                      onClick={handleNameUpdate}
                      className="p-2.5 rounded-lg bg-green-500 hover:bg-green-600 transition-colors"
                    >
                      <Check size={18} className="text-white" />
                    </button>
                    <button
                      onClick={() => {
                        setEditName(currentUser?.name || '');
                        setEditingField(null);
                      }}
                      className="p-2.5 rounded-lg bg-neutral-700 hover:bg-neutral-600 transition-colors"
                    >
                      <X size={18} className="text-white" />
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-3 py-2"
                  >
                    <User size={18} className="text-neutral-500" />
                    <span className="text-white font-medium">
                      {currentUser?.name || 'Not set'}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Email Field (Read-only) */}
            <div className="p-4">
              <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider block mb-2">
                Email Address
              </label>
              <div className="flex items-center gap-3 py-2">
                <Mail size={18} className="text-neutral-500" />
                <span className="text-neutral-400">
                  {currentUser?.email || 'Not set'}
                </span>
              </div>
            </div>

            {/* Mobile Field */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Mobile Number
                </label>
                {editingField !== 'mobile' && (
                  <button
                    onClick={() => {
                      setEditingField('mobile');
                      setMobile(currentUser?.mobile || '');
                    }}
                    className="text-secondary-500 hover:text-secondary-400 transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                )}
              </div>
              
              <AnimatePresence mode="wait">
                {editingField === 'mobile' ? (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex gap-2"
                  >
                    <div className="relative flex-1 flex overflow-hidden rounded-lg border border-neutral-700 bg-primary-900">
                      <div className="flex items-center gap-2 px-3 text-neutral-400 border-r border-neutral-700">
                        <Phone size={18} className="text-neutral-500" />
                        <span className="text-sm">+91</span>
                      </div>
                      <input
                        type="tel"
                        value={mobile}
                        onChange={handleMobileChange}
                        onKeyDown={(e) => e.key === 'Enter' && handleMobileUpdate()}
                        maxLength={10}
                        autoFocus
                        className="flex-1 bg-transparent py-2.5 px-4 text-white focus:outline-none"
                        placeholder="9876543210"
                      />
                    </div>
                    <button
                      onClick={handleMobileUpdate}
                      className="p-2.5 rounded-lg bg-green-500 hover:bg-green-600 transition-colors"
                    >
                      <Check size={18} className="text-white" />
                    </button>
                    <button
                      onClick={() => {
                        setMobile(currentUser?.mobile || '');
                        setEditingField(null);
                      }}
                      className="p-2.5 rounded-lg bg-neutral-700 hover:bg-neutral-600 transition-colors"
                    >
                      <X size={18} className="text-white" />
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-3 py-2"
                  >
                    <Phone size={18} className="text-neutral-500" />
                    <span className="text-white font-medium">
                      {currentUser?.mobile ? `+91 ${currentUser.mobile}` : 'Not set'}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Gender Field */}
            <div className="p-4">
              <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider block mb-3">
                Gender
              </label>
              <div className="flex gap-2">
                {['Male', 'Female', 'Other'].map((genderOption) => (
                  <button
                    key={genderOption}
                    onClick={() => handleGenderUpdate(genderOption)}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                      gender === genderOption
                        ? 'bg-secondary-500 text-white shadow-lg'
                        : 'bg-primary-900 text-neutral-400 hover:bg-primary-800 border border-neutral-700'
                    }`}
                  >
                    {genderOption}
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Notification Settings */}
        {pushNotificationService.isSupported && (
          <div>
            <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-3 px-1">
              Notifications
            </h3>
            <Card>
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${notificationsEnabled ? 'bg-green-500/10' : 'bg-neutral-700/50'}`}>
                      <Bell size={20} className={notificationsEnabled ? 'text-green-400' : 'text-neutral-500'} />
                    </div>
                    <div>
                      <p className="font-medium text-white">Push Notifications</p>
                      <p className="text-sm text-neutral-400">
                        {notificationsEnabled ? 'Enabled' : 'Get real-time updates'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleToggleNotifications}
                    disabled={togglingNotifications || pushNotificationService.isPermissionDenied()}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      notificationsEnabled ? 'bg-green-500' : 'bg-neutral-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                        notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {!pushNotificationService.isPermissionDenied() && (
                  <div className="bg-primary-900 border border-neutral-700 rounded-lg p-3">
                    <p className="text-xs text-neutral-400 mb-2">
                      {notificationsEnabled ? "You'll receive notifications for:" : "Enable to get notified about:"}
                    </p>
                    <ul className="text-xs text-neutral-300 space-y-1">
                      <li className="flex items-start gap-2">
                        <span className="text-secondary-500 mt-0.5">•</span>
                        <span>New expenses added to your groups</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-secondary-500 mt-0.5">•</span>
                        <span>Settlement payments received or requested</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-secondary-500 mt-0.5">•</span>
                        <span>Group invitations and member updates</span>
                      </li>
                    </ul>
                  </div>
                )}

                {pushNotificationService.isPermissionDenied() && (
                  <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3">
                    <p className="text-xs text-red-400 font-medium mb-1">Notifications Blocked</p>
                    <p className="text-xs text-neutral-400">
                      Enable in browser settings: <span className="text-white">🔒 → Notifications → Allow</span>
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Account Actions */}
        <div>
          <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-3 px-1">
            Account
          </h3>
          <Card className="divide-y divide-neutral-800">
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full p-4 flex items-center justify-between hover:bg-red-500/5 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/10 group-hover:bg-red-500/20 transition-colors">
                  <LogOut size={18} className="text-red-400" />
                </div>
                <span className="text-white font-medium">Sign Out</span>
              </div>
              <ChevronRight size={18} className="text-neutral-500 group-hover:text-red-400 transition-colors" />
            </button>
          </Card>
        </div>

        {/* App Info */}
        <div className="text-center py-6 space-y-1">
          <p className="text-xs text-neutral-600">
            Made with ❤️ by{' '}
            <a
              href="https://portfolio-samarth-nagpal.infinityfreeapp.com/?i=1"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-500 hover:text-orange-400 transition-colors font-medium"
            >
              Samarth Nagpal
            </a>
          </p>
        </div>
      </div>

      {/* Avatar Picker Modal */}
      <Modal
        isOpen={showAvatarPicker}
        onClose={() => !uploading && setShowAvatarPicker(false)}
        title="Choose Profile Picture"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block w-full">
              <input
                type="file"
                accept="image/*,.heic,.heif"
                onChange={handleImageUpload}
                className="hidden"
                disabled={uploading}
              />
              <div className={`w-full py-3 px-4 rounded-lg text-white text-center font-medium transition-all ${
                uploading 
                  ? 'bg-neutral-700 cursor-not-allowed' 
                  : 'bg-secondary-500 hover:bg-secondary-600 cursor-pointer shadow-lg hover:shadow-secondary-500/30'
              }`}>
                {uploading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                    <span>Uploading...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Upload size={18} />
                    <span>Upload Custom Photo</span>
                  </div>
                )}
              </div>
            </label>
            <p className="text-xs text-neutral-500 mt-2 text-center">
              Maximum file size: 5MB
            </p>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-700"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-primary-950 text-neutral-500">Or choose an avatar</span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3 max-h-96 overflow-y-auto p-1">
            {predefinedAvatars.map((avatar, index) => (
              <button
                key={index}
                onClick={() => handleAvatarSelect(avatar)}
                disabled={uploading}
                className={`aspect-square rounded-xl overflow-hidden transition-all hover:scale-105 ${
                  currentUser?.profileImage === avatar 
                    ? 'ring-4 ring-secondary-500 shadow-lg shadow-secondary-500/30' 
                    : 'ring-2 ring-transparent hover:ring-secondary-500/50'
                } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <img 
                  src={avatar} 
                  alt={`Avatar ${index + 1}`} 
                  className="w-full h-full object-cover" 
                />
              </button>
            ))}
          </div>
        </div>
      </Modal>

      {/* Delete Image Confirmation */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Profile Image"
        size="sm"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteImage}>
              Delete
            </Button>
          </div>
        }
      >
        <p className="text-neutral-300">
          Are you sure you want to delete your profile image? This action cannot be undone.
        </p>
      </Modal>

      {/* Logout Confirmation */}
      <Modal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        title="Sign Out"
        size="sm"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setShowLogoutConfirm(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleLogout}>
              Sign Out
            </Button>
          </div>
        }
      >
        <p className="text-neutral-300">
          Are you sure you want to sign out? You'll need to sign in again to access your account.
        </p>
      </Modal>
    </Screen>
  );
};
