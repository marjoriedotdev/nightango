import type { ReactNode, CSSProperties, ButtonHTMLAttributes, InputHTMLAttributes } from 'react';

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
export interface AvatarProps { name: string; size?: number; status?: Presence; color?: string; ring?: string; square?: boolean; /** Photo de profil ; les initiales restent affichées si elle ne charge pas. */ src?: string | null; /** Appelé quand la photo de profil est chargée. */ onLoad?: () => void }
export interface NavItemProps { label: ReactNode; icon?: IconName; avatar?: ReactNode; active?: boolean; unread?: boolean; count?: number; mention?: boolean; muted?: boolean; href?: string; onClick?: () => void; trailing?: ReactNode }
export interface MessageProps { time: string; /** Un texte devient un p.tc-msg-text avec ses @mentions, un élément est rendu tel quel. */ children: ReactNode; /** Un texte devient un span.tc-msg-author, un élément est rendu tel quel. */ author?: ReactNode; avatar?: ReactNode; /** Rôle et canal, après le nom. */ meta?: ReactNode; reply?: { author?: ReactNode; avatar?: ReactNode; text: ReactNode; /** Fait du texte cité un bouton qui mène au message d'origine. */ onJump?: () => void } | null; /** Contenu de la barre d'actions au survol. */ actions?: ReactNode; /** Dessiné derrière toute la ligne, sous le texte, comme l'image de fond de message d'un membre. Masqué par highlight. */ background?: ReactNode; compact?: boolean; continued?: boolean; mention?: boolean; /** Posé en data-msg-id pour retrouver la ligne dans le fil. */ msgId?: string; /** Fond selected, devant le fond du membre. */ highlight?: boolean; className?: string; style?: CSSProperties }
export interface DayDividerProps { children: ReactNode }
export interface BannerProps { tone?: 'info' | 'warning'; icon?: IconName; title?: ReactNode; children: ReactNode; action?: ReactNode; onDismiss?: () => void }
export interface SettingsSectionProps { title?: ReactNode; description?: ReactNode; headerAside?: ReactNode; padded?: boolean; children?: ReactNode }
export interface SettingRowProps { title: ReactNode; description?: ReactNode; control: ReactNode; badge?: ReactNode; asLabel?: boolean }
export interface SaveBarProps { children: ReactNode; onDiscard?: () => void; onSave?: () => void; saveLabel?: string; discardLabel?: string }
export interface ComposerProps { placeholder: string; onSend: (text: string) => void; value?: string; onChange?: (value: string) => void; replyTo?: { author: string; text: string } | null; onCancelReply?: () => void; onTyping?: () => void; onEmoji?: () => void; onAttach?: () => void; aside?: ReactNode; beforeSend?: ReactNode; label?: string; /** Reçoit le champ de saisie, pour lui rendre le focus. */ inputRef?: { current: HTMLTextAreaElement | null } }
export interface SkeletonProps { width: number | string; height?: number | string; circle?: boolean }
export interface SpinnerProps { size?: number; /** Nom accessible, omis quand un texte visible annonce déjà le chargement. */ label?: string }
