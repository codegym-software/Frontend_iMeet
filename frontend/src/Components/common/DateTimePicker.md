# DateTimePicker Component

Một component DateTimePicker giống Google Calendar cho React, hỗ trợ chọn ngày và giờ với giao diện thân thiện.

## Tính năng

- ✅ Chọn ngày từ calendar
- ✅ Chọn giờ với dropdown (15 phút interval)
- ✅ Hỗ trợ AM/PM
- ✅ Giao diện giống Google Calendar
- ✅ Responsive design
- ✅ Dark mode support
- ✅ Validation tự động
- ✅ Keyboard navigation
- ✅ Accessibility support

## Cách sử dụng

### Import component

```jsx
import DateTimePicker from './Components/common/DateTimePicker';
```

### Sử dụng cơ bản

```jsx
import React, { useState } from 'react';
import DateTimePicker from './Components/common/DateTimePicker';

const MyComponent = () => {
  const [dateTime, setDateTime] = useState(null);

  return (
    <DateTimePicker
      value={dateTime}
      onChange={setDateTime}
      placeholder="Chọn ngày và giờ"
    />
  );
};
```

### Sử dụng trong MeetingForm

```jsx
// Start DateTime
<DateTimePicker
  value={formData.startDateTime}
  onChange={(date) => setFormData(prev => ({ ...prev, startDateTime: date }))}
  placeholder="Chọn ngày và giờ bắt đầu"
  showTime={!formData.isAllDay}
  showDate={true}
/>

// End DateTime
<DateTimePicker
  value={formData.endDateTime}
  onChange={(date) => setFormData(prev => ({ ...prev, endDateTime: date }))}
  placeholder="Chọn ngày và giờ kết thúc"
  showTime={!formData.isAllDay}
  showDate={true}
/>
```

## Props

| Prop | Type | Default | Mô tả |
|------|------|---------|-------|
| `value` | `Date` | `null` | Giá trị ngày giờ hiện tại |
| `onChange` | `function` | - | Callback khi giá trị thay đổi |
| `placeholder` | `string` | `"Chọn ngày và giờ"` | Placeholder text |
| `showTime` | `boolean` | `true` | Hiển thị time picker |
| `showDate` | `boolean` | `true` | Hiển thị date picker |
| `disabled` | `boolean` | `false` | Disable component |
| `className` | `string` | `""` | CSS class tùy chỉnh |

## Styling

Component sử dụng CSS modules và có thể customize thông qua CSS variables:

```css
.date-time-picker {
  --primary-color: #1a73e8;
  --border-color: #dadce0;
  --text-color: #3c4043;
  --background-color: white;
}
```

## Keyboard Navigation

- `Tab`: Di chuyển giữa các elements
- `Enter`: Chọn ngày/giờ
- `Escape`: Đóng picker
- `Arrow keys`: Di chuyển trong calendar/time picker

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Demo

Xem file `DateTimePickerDemo.js` để có ví dụ đầy đủ về cách sử dụng component.

## Cập nhật MeetingForm

MeetingForm đã được cập nhật để sử dụng DateTimePicker thay vì input fields cũ:

### Trước:
```jsx
<input type="text" name="date" value={formData.date} />
<input type="text" name="startTime" value={formData.startTime} />
<input type="text" name="endTime" value={formData.endTime} />
```

### Sau:
```jsx
<DateTimePicker
  value={formData.startDateTime}
  onChange={(date) => setFormData(prev => ({ ...prev, startDateTime: date }))}
  showTime={!formData.isAllDay}
  showDate={true}
/>
```

## Lưu ý

- Component trả về Date object, cần convert sang ISO string khi gửi API
- Hỗ trợ timezone local của browser
- Validation được thực hiện ở component cha
- Component tự động đóng khi click outside

