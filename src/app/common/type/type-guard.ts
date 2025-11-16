export function isPointerEvent(event: PointerEvent | MouseEvent)
  : event is PointerEvent {
  return !!(<PointerEvent>event).pointerType;
}
