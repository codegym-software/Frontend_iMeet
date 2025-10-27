// Hook to coordinate meetings with device inventory
import { useCallback } from 'react';
import { useMeetings } from '../contexts/MeetingContext';
import { useDeviceInventory } from '../contexts/DeviceInventoryContext';

export const useMeetingWithDevices = () => {
  const meetings = useMeetings();
  const deviceInventory = useDeviceInventory();

  // Create meeting and borrow devices
  const createMeetingWithDevices = useCallback((meetingData) => {
    // Add to meetings cache
    meetings.addMeeting(meetingData);
    
    // Borrow devices
    if (meetingData.devices && meetingData.devices.length > 0) {
      deviceInventory.borrowDevices(meetingData.devices, meetingData.meetingId);
    }
  }, [meetings, deviceInventory]);

  // Delete meeting and return devices
  const deleteMeetingWithDevices = useCallback((meetingId) => {
    // Find meeting
    const meeting = meetings.meetings.find(m => m.meetingId === meetingId);
    
    // Return devices first
    if (meeting && meeting.devices && meeting.devices.length > 0) {
      deviceInventory.returnDevices(meeting.devices, meetingId);
    }
    
    // Remove from meetings cache
    meetings.deleteMeeting(meetingId);
  }, [meetings, deviceInventory]);

  // Update meeting and adjust devices
  const updateMeetingWithDevices = useCallback((oldMeeting, updatedMeeting) => {
    // Update device inventory
    deviceInventory.updateMeetingDevices(
      oldMeeting?.devices || [],
      updatedMeeting.devices || [],
      updatedMeeting.meetingId
    );
    
    // Update meetings cache
    meetings.updateMeeting(updatedMeeting);
  }, [meetings, deviceInventory]);

  return {
    ...meetings,
    ...deviceInventory,
    createMeetingWithDevices,
    deleteMeetingWithDevices,
    updateMeetingWithDevices
  };
};

export default useMeetingWithDevices;

