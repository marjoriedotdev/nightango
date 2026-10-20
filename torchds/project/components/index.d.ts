import type { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes } from 'react';

export type IconName = string;
export type Presence = 'online' | 'idle' | 'offline';

export interface IconProps { name: IconName; size?: number; strokeWidth?: number; label?: string; className?: string }
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> { variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; size?: 'sm' | 'md' | 'lg'; block?: boolean; icon?: IconName; iconRight?: IconName; children?: ReactNode }
export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> { icon: IconName; label: string; size?: number; iconSize?: number; pressed?: boolean }
export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> { label?: string; hint?: string; error?: string; multiline?: boolean; rows?: number; labelAside?: ReactNode }
export interface SwitchProps extends InputHTMLAttributes<HTMLInputElement> { label?: string }
export interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> { label?: ReactNode; ariaLabel?: string }
export interface SegmentedControlProps { options: Array<string | { value: string; label: ReactNode }>; value: string; onChange?: (value: string) => void; label: string; block?: boolean }
export interface BadgeProps { tone?: 'neutral' | 'accent'; icon?: IconName; children: ReactNode }
export interface CountBadgeProps { count: number; mention?: boolean }
export interface AvatarProps { name: string; size?: number; status?: Presence; color?: string; ring?: string; square?: boolean; /** Photo de profil ; les initiales restent affichées si elle ne charge pas. */ src?: string | null }
export interface NavItemProps { label: ReactNode; icon?: IconName; avatar?: ReactNode; active?: boolean; unread?: boolean; count?: number; mention?: boolean; muted?: boolean; href?: string; onClick?: () => void; trailing?: ReactNode }
export interface MessageProps { author: string; time: string; children: ReactNode; role?: 'Owner' | 'Mod' | string; continued?: boolean; mention?: boolean; reply?: { author: string; text: string }; avatarColor?: string; avatarSrc?: string | null; extra?: ReactNode; onReply?: () => void; onReact?: () => void; onMore?: () => void }
export interface DayDividerProps { children: ReactNode }
export interface BannerProps { tone?: 'info' | 'warning'; icon?: IconName; title?: ReactNode; children: ReactNode; action?: ReactNode; onDismiss?: () => void }
export interface SettingsSectionProps { title?: ReactNode; description?: ReactNode; headerAside?: ReactNode; padded?: boolean; children?: ReactNode }
export interface SettingRowProps { title: ReactNode; description?: ReactNode; control: ReactNode; badge?: ReactNode; asLabel?: boolean }
export interface SaveBarProps { children: ReactNode; onDiscard?: () => void; onSave?: () => void; saveLabel?: string; discardLabel?: string }
export interface ComposerProps { placeholder: string; onSend: (text: string) => void; value?: string; onChange?: (value: string) => void; replyTo?: { author: string; text: string } | null; onCancelReply?: () => void; onTyping?: () => void; onEmoji?: () => void; onAttach?: () => void; aside?: ReactNode; tools?: boolean; label?: string }
