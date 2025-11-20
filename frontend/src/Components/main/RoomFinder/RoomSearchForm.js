import React from 'react';
import DateTimePicker from '../../common/DateTimePicker';

const RoomSearchForm = ({
  criteria,
  onChange,
  onToggleDeviceType,
  onSubmit,
  onClear,
  deviceTypeOptions,
  loading,
  formError
}) => {
  const handleParticipantsChange = (e) => {
    onChange('participants', e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!loading) {
      onSubmit();
    }
  };

  return (
    <div className="roomfinder-card">
      <div className="roomfinder-card__header">
        <div>
          <p className="eyebrow">Tìm phòng họp</p>
          <h2>Nhập tiêu chí của bạn</h2>
          <p className="subtitle">Chọn ngày, giờ, số người và loại thiết bị cần thiết</p>
        </div>
      </div>

      <form className="roomfinder-form" onSubmit={handleSubmit}>
        <div className="form-field">
          <label>Ngày họp</label>
          <DateTimePicker
            value={criteria.selectedDate}
            onChange={(date) => onChange('selectedDate', date)}
            showTime={false}
            showDate={true}
            displayFormat="date"
            className="roomfinder-date-picker"
            placeholder="Chọn ngày"
          />
        </div>

        <div className="form-field form-field--grid">
          <div>
            <label>Giờ bắt đầu</label>
            <DateTimePicker
              value={criteria.startDateTime}
              onChange={(date) => onChange('startDateTime', date)}
              showDate={false}
              showTime={true}
              displayFormat="time"
              className="roomfinder-time-picker"
              placeholder="9:00 AM"
            />
          </div>
          <div>
            <label>Giờ kết thúc</label>
            <DateTimePicker
              value={criteria.endDateTime}
              onChange={(date) => onChange('endDateTime', date)}
              showDate={false}
              showTime={true}
              displayFormat="time"
              mode="end"
              baseDate={criteria.startDateTime}
              className="roomfinder-time-picker"
              placeholder="10:00 AM"
            />
          </div>
        </div>

        <div className="form-field">
          <label>Số người tham gia</label>
          <input
            type="number"
            min="1"
            placeholder="Ví dụ: 12"
            value={criteria.participants}
            onChange={handleParticipantsChange}
          />
        </div>

        <div className="form-field">
          <label>Loại thiết bị cần có</label>
          <div className="device-chip-group">
            {(deviceTypeOptions || []).map((device) => {
              const isSelected = criteria.deviceTypes.includes(device.id);
              return (
                <button
                  key={device.id}
                  type="button"
                  className={`device-chip ${isSelected ? 'selected' : ''}`}
                  onClick={() => onToggleDeviceType(device.id)}
                >
                  <span>{device.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {formError && <div className="form-error">{formError}</div>}

        <div className="form-actions-inline">
          <button
            type="button"
            className="ghost-btn"
            onClick={onClear}
            disabled={loading}
          >
            Xóa bộ lọc
          </button>
          <button className="primary-btn" type="submit" disabled={loading}>
            {loading ? 'Đang tìm...' : 'Tìm phòng phù hợp'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RoomSearchForm;

