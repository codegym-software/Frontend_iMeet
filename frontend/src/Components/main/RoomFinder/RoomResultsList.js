import React from 'react';
import RoomResultCard from './RoomResultCard';

const formatRangeLabel = (searchRange) => {
  if (!searchRange?.start || !searchRange?.end) return '';
  const dateFormatter = new Intl.DateTimeFormat('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  const timeFormatter = new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit'
  });
  return `${dateFormatter.format(searchRange.start)} • ${timeFormatter.format(searchRange.start)} - ${timeFormatter.format(searchRange.end)}`;
};

const RoomResultsList = ({
  rooms,
  loading,
  error,
  hasSearched,
  searchRange,
  onRetry,
  onBookRoom,
  onViewDetails
}) => {
  const summary = searchRange ? formatRangeLabel(searchRange) : '';
  const headerSubtitle = hasSearched
    ? (summary || 'Các phòng phù hợp với tiêu chí đã chọn')
    : 'Đang hiển thị toàn bộ phòng hiện có';

  return (
    <div className="roomfinder-results">
      <div className="roomfinder-results__header">
        <div>
          <p className="eyebrow">Kết quả phù hợp</p>
          <h2>{rooms.length || 0} phòng có thể đặt</h2>
          <p className="subtitle">{headerSubtitle}</p>
        </div>
        {hasSearched && searchRange?.minCapacity && (
          <span className="badge">≥ {searchRange.minCapacity} người</span>
        )}
      </div>

      <div className="roomfinder-results__body">
        {loading && (
          <div className="state state--loading">
            <span className="spinner" />
            <p>Đang kiểm tra phòng trống...</p>
          </div>
        )}

        {!loading && error && (
          <div className="state state--error">
            <p>{error}</p>
            <button className="secondary-btn" type="button" onClick={onRetry}>
              Thử lại
            </button>
          </div>
        )}

        {!loading && !error && rooms.length === 0 && hasSearched && (
          <div className="state state--empty">
            <div className="emoji">😔</div>
            <h3>Không có phòng phù hợp</h3>
            <p>Hãy thay đổi thời gian, giảm bớt thiết bị hoặc số người.</p>
            <button className="secondary-btn" type="button" onClick={onRetry}>
              Tìm lại
            </button>
          </div>
        )}

        {!loading && !error && rooms.length === 0 && !hasSearched && (
          <div className="state state--empty">
            <div className="emoji">📭</div>
            <h3>Chưa có phòng trong hệ thống</h3>
            <p>Thêm dữ liệu phòng để bắt đầu sử dụng tính năng tìm kiếm.</p>
          </div>
        )}

        {!loading && !error && rooms.length > 0 && (
          <div className="room-list">
            {rooms.map(room => (
              <RoomResultCard
                key={room.id}
                room={room}
                onBook={() => onBookRoom(room)}
                onViewDetails={() => onViewDetails && onViewDetails(room)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomResultsList;

