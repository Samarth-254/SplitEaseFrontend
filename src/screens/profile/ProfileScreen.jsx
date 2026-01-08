import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  LogOut, 
  Camera,
  Moon,
  Edit2,
  Check,
  X,
  Heart,
  Phone,
  Trash2,
  Upload
} from 'lucide-react';
import { Screen, PageTitle } from '../../components/layout';
import { Button, Card, Avatar, Modal } from '../../components/ui';
import { useStore } from '../../store/useStore';

/**
 * Profile Screen
 * 
 * User profile and settings with edit capabilities
 */

export const ProfileScreen = () => {
  const navigate = useNavigate();
  const { currentUser, logout, updateProfile, deleteProfileImage } = useStore();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [editName, setEditName] = useState(currentUser?.name || '');
  const [uploading, setUploading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [mobile, setMobile] = useState(currentUser?.mobile || '');
  const [gender, setGender] = useState(currentUser?.gender || '');

  const predefinedAvatars = [
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Bailey',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Max',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Bella',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Leo',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Mia',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Jack',
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNameChange = (e) => {
    setEditName(e.target.value);
  };

  const handleNameUpdate = async () => {
    if (editName.trim() && editName !== currentUser?.name) {
      await updateProfile({ name: editName });
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
    }
  };

  const handleGenderUpdate = async (newGender) => {
    setGender(newGender);
    await updateProfile({ gender: newGender });
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
      setUploading(false);
      setShowAvatarPicker(false);
    }
  };

  const handleAvatarSelect = async (avatarUrl) => {
    setUploading(true);
    await updateProfile({ profileImage: avatarUrl });
    setUploading(false);
    setShowAvatarPicker(false);
  };

  const handleDeleteImage = async () => {
    await deleteProfileImage();
    setShowDeleteConfirm(false);
  };

  return (
    <Screen>
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5 w-full max-w-xl mx-auto px-4"
        >
          <Card>
          <div className="text-center mb-6">
            <div className="relative inline-block mb-4">
              {currentUser?.profileImage ? (
                <img 
                  src={currentUser.profileImage} 
                  alt="Profile" 
                  className="w-24 h-24 rounded-full object-cover mx-auto border-4 border-neutral-800"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-primary-900 flex items-center justify-center mx-auto border-4 border-neutral-800 text-4xl text-white">
                  {currentUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
              
              <label className="absolute bottom-0 right-0 p-2 rounded-full bg-secondary-500 hover:bg-secondary-600 transition-colors shadow-lg cursor-pointer">
                {uploading ? (
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <Camera size={16} className="text-white" onClick={() => setShowAvatarPicker(true)} />
                )}
              </label>

              {currentUser?.profileImage && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="absolute top-0 right-0 p-2 rounded-full bg-red-500 hover:bg-red-600 transition-colors shadow-lg"
                >
                  <Trash2 size={16} className="text-white" />
                </button>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-neutral-500 block mb-2">Name</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input
                    type="text"
                    value={editName}
                    onChange={handleNameChange}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-secondary-500 transition-colors"
                    placeholder="Your name"
                  />
                </div>
                {editName !== currentUser?.name && (
                  <Button onClick={handleNameUpdate} size="sm">
                    <Check size={16} />
                  </Button>
                )}
              </div>
            </div>

            <div>
              <label className="text-xs text-neutral-500 block mb-2">Email</label>
              <div className="flex items-center gap-3 bg-neutral-900 border border-neutral-700 rounded-lg py-2.5 px-4 opacity-75">
                <Mail size={18} className="text-neutral-500" />
                <span className="flex-1 text-neutral-400">{currentUser?.email || 'Not set'}</span>
              </div>
            </div>

            <div>
              <label className="text-xs text-neutral-500 block mb-2">Mobile Number</label>
              <div className="flex gap-2">
                <div className="relative flex-1 min-w-0">
                  <div className="flex w-full min-w-0 overflow-hidden">
                    <div className="flex items-center gap-2 bg-neutral-800 border border-neutral-700 rounded-l-lg py-2.5 px-3 text-neutral-400 flex-shrink-0">
                      <Phone size={18} className="text-neutral-500" />
                      <span>+91</span>
                    </div>
                    <input
                      type="tel"
                      value={mobile}
                      onChange={handleMobileChange}
                      maxLength={10}
                      className="w-0 flex-1 min-w-0 bg-neutral-800 border border-l-0 border-neutral-700 rounded-r-lg py-2.5 px-4 text-white focus:outline-none focus:border-secondary-500 transition-colors"
                      placeholder="9876543210"
                    />
                  </div>
                </div>
                {mobile !== currentUser?.mobile && (
                  <Button onClick={handleMobileUpdate} size="sm">
                    <Check size={16} />
                  </Button>
                )}
              </div>
            </div>

            <div>
              <label className="text-xs text-neutral-500 block mb-2">Gender</label>
              <div className="flex gap-2">
                {['Male', 'Female', 'Other'].map((genderOption) => (
                  <button
                    key={genderOption}
                    onClick={() => handleGenderUpdate(genderOption)}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                      gender === genderOption
                        ? 'bg-secondary-500 text-white'
                        : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 border border-neutral-700'
                    }`}
                  >
                    {genderOption}
                  </button>
                ))}
              </div>
            </div>
          </div>
          </Card>

          {/* Sign Out Button - Mobile Only */}
          <div className="block sm:hidden">
            <Button
              variant="danger"
              fullWidth
              onClick={() => setShowLogoutConfirm(true)}
            >
              <LogOut size={18} className="mr-2" />
              Sign Out
            </Button>
          </div>

        {/* <div className="text-center py-4">
          <p className="text-xs text-neutral-600">
            SplitEase v1.0.0
          </p>
          <p className="text-xs text-neutral-600 flex items-center justify-center gap-1 mt-1">
            Made with <Heart size={12} className="text-red-500" /> for splitting expenses
          </p>
        </div> */}
        </motion.div>
      </div>

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
              <div className={`w-full py-3 px-4 rounded-lg text-white text-center font-medium transition-colors ${
                uploading 
                  ? 'bg-neutral-700 cursor-not-allowed' 
                  : 'bg-orange-500 hover:bg-orange-600 cursor-pointer'
              }`}>
                {uploading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                    <span>Uploading...</span>
                  </div>
                ) : (
                  <>
                    <Upload size={18} className="inline mr-2" />
                    Upload Custom Photo
                  </>
                )}
              </div>
            </label>
          </div>

          <div>
            <p className="text-sm text-neutral-400 mb-3">Or choose an avatar:</p>
            <div className="grid grid-cols-4 gap-3 max-h-96 overflow-y-auto">
              {predefinedAvatars.map((avatar, index) => (
                <button
                  key={index}
                  onClick={() => handleAvatarSelect(avatar)}
                  disabled={uploading}
                  className={`aspect-square rounded-lg overflow-hidden transition-all hover:ring-2 hover:ring-secondary-500 ${
                    currentUser?.profileImage === avatar 
                      ? 'ring-2 ring-secondary-500' 
                      : ''
                  } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <img src={avatar} alt={`Avatar ${index + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>

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
          Are you sure you want to delete your profile image?
        </p>
      </Modal>

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





