# ActivityButton Component Demo

## Overview
The ActivityButton is a large, tappable button designed for one-handed use that displays an activity icon and label with color-coded backgrounds.

## Usage Example

```tsx
import { ActivityButton } from '@/components';

// Example: Feed button
<ActivityButton
  type="feed"
  label="Feeding"
  icon="🍼"
  onPress={() => console.log('Feed activity pressed')}
/>

// Example: Diaper button
<ActivityButton
  type="diaper"
  label="Diaper"
  icon="🍑"
  onPress={() => console.log('Diaper activity pressed')}
/>

// Example: Sleep button
<ActivityButton
  type="sleep"
  label="Sleep"
  icon="😴"
  onPress={() => console.log('Sleep activity pressed')}
/>
```

## Features

### 1. Large Tap Target
- Minimum height of 100px
- 20px padding for comfortable tapping
- Perfect for one-handed use

### 2. Color-Coded by Activity Type
- **Feed**: Blue (#4A90D9)
- **Diaper**: Yellow (#F5C842)
- **Sleep**: Purple (#9B6BC2)
- **Pump**: Pink (#E891B0)
- **Growth**: Green (#5CB85C)

### 3. Visual Feedback
- ActiveOpacity of 0.7 provides tap feedback
- Shadow and elevation for depth
- Rounded corners (16px border radius)

### 4. Accessibility
- Proper accessibility labels
- Hints for screen readers
- Button role for assistive technologies

## Component Props

| Prop | Type | Description |
|------|------|-------------|
| type | ActivityType | The activity type (feed, diaper, sleep, pump, growth) |
| label | string | The text label to display |
| icon | string | The emoji icon to display |
| onPress | () => void | Callback function when button is pressed |

## Testing

All tests pass (9/9):
- ✓ Renders with correct label
- ✓ Renders with correct icon
- ✓ Handles press events
- ✓ Applies correct background colors for all activity types
- ✓ Has proper accessibility properties

## Integration

The component is exported from `/src/components/index.ts` for easy importing:

```tsx
import { ActivityButton } from '@/components';
// or
import { ActivityButton, ActivityButtonProps } from '@/components';
```
