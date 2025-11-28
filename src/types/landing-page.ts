// Landing Page Creator Types
export type LandingPageSaveType = 'auto' | 'manual';

export interface LandingPageContent {
  [key: string]: any;
}

export interface BaseLandingPagePayload {
  name: string;
  content: LandingPageContent;
  save_type?: LandingPageSaveType;
  save_slot?: number | null;
}

export interface CreateLandingPageRequest extends BaseLandingPagePayload {}

export interface UpdateLandingPageRequest extends Partial<BaseLandingPagePayload> {
  id: string;
}

export interface PublishLandingPageRequest {
  id: string;
}

export interface LandingPageData {
  id: string;
  organization_id: string;
  name: string;
  content: LandingPageContent;
  is_published: boolean;
  published_at?: string | null;
  save_type?: LandingPageSaveType;
  save_slot?: number | null;
  created_at: string;
  updated_at: string;
  created_by?: string;
  from_draft?: boolean;
}

export interface LandingPageResponse {
  success: boolean;
  error?: string;
  landing_page?: LandingPageData;
  landing_pages?: LandingPageData[];
}
export type ElementType =
  | 'title'
  | 'subtitle'
  | 'paragraph'
  | 'image'
  | 'video'
  | 'button'
  | 'countdown'
  | 'form'
  | 'highlight'
  | 'icon-list'
  | 'divider'
  | 'testimonial'
  | 'faq'
  | 'container'
  | 'columns'

export type ViewMode = 'desktop' | 'mobile'

export type ColorPalette = {
  primary: string
  secondary: string
  background: string
  text: string
  accent?: string
  primaryGradient?: string // e.g., "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
  secondaryGradient?: string
  backgroundGradient?: string
}

export type FontFamily = 'inter' | 'poppins' | 'roboto' | 'geist-sans'

export interface BaseElement {
  id: string
  type: ElementType
  styles?: {
    padding?: string
    margin?: string
    backgroundColor?: string
    backgroundGradient?: string
    color?: string
    fontSize?: string
    fontWeight?: string
    textAlign?: 'left' | 'center' | 'right'
    borderRadius?: string
    width?: string
    height?: string
    maxWidth?: string
    maxHeight?: string
    minWidth?: string
    minHeight?: string
  }
}

export interface TitleElement extends BaseElement {
  type: 'title' | 'subtitle'
  content: string
  level?: 1 | 2 | 3 | 4 | 5 | 6
}

export interface ParagraphElement extends BaseElement {
  type: 'paragraph'
  content: string
}

export interface ImageElement extends BaseElement {
  type: 'image'
  src: string
  alt: string
  width?: string
  height?: string
}

export interface VideoElement extends BaseElement {
  type: 'video'
  src: string
  autoplay?: boolean
  controls?: boolean
}

export interface ButtonElement extends BaseElement {
  type: 'button'
  text: string
  href?: string
  onClick?: string
  variant?: 'primary' | 'secondary' | 'outline'
}

export interface CountdownElement extends BaseElement {
  type: 'countdown'
  targetDate: string
  format?: string
}

export interface FormElement extends BaseElement {
  type: 'form'
  fields: FormField[]
  submitText?: string
  action?: string
}

export interface FormField {
  id: string
  type: 'text' | 'email' | 'tel' | 'textarea' | 'select'
  label: string
  placeholder?: string
  required?: boolean
  options?: string[] // for select
}

export interface HighlightElement extends BaseElement {
  type: 'highlight'
  content: string
  variant?: 'info' | 'success' | 'warning' | 'error'
}

export interface IconListElement extends BaseElement {
  type: 'icon-list'
  items: IconListItem[]
  columns?: 1 | 2 | 3
}

export interface IconListItem {
  id: string
  icon?: string
  text: string
}

export interface DividerElement extends BaseElement {
  type: 'divider'
  variant?: 'solid' | 'dashed' | 'dotted'
}

export interface TestimonialElement extends BaseElement {
  type: 'testimonial'
  testimonials: Testimonial[]
  layout?: 'carousel' | 'cards' | 'grid'
}

export interface Testimonial {
  id: string
  name: string
  role?: string
  content: string
  avatar?: string
  rating?: number
}

export interface FAQElement extends BaseElement {
  type: 'faq'
  items: FAQItem[]
}

export interface FAQItem {
  id: string
  question: string
  answer: string
}

export interface ContainerElement extends BaseElement {
  type: 'container' | 'columns'
  children: LandingPageElement[]
  columns?: 1 | 2 | 3
  gap?: string
}

export type LandingPageElement =
  | TitleElement
  | ParagraphElement
  | ImageElement
  | VideoElement
  | ButtonElement
  | CountdownElement
  | FormElement
  | HighlightElement
  | IconListElement
  | DividerElement
  | TestimonialElement
  | FAQElement
  | ContainerElement

export interface Section {
  id: string
  type: 'header' | 'hero' | 'content' | 'form' | 'testimonials' | 'footer' | 'custom'
  elements: LandingPageElement[]
  styles?: {
    backgroundColor?: string
    backgroundImage?: string
    backgroundGradient?: string
    background?: string
    padding?: string
    margin?: string
    marginTop?: string
    color?: string
    textAlign?: 'left' | 'center' | 'right'
    maxWidth?: string
    borderRadius?: string
    border?: string
    borderTop?: string
    borderBottom?: string
    backdropFilter?: string
    position?: string
    top?: string | number
    zIndex?: number | string
    boxShadow?: string
    overflow?: string
    minHeight?: string
    display?: string
    flexDirection?: string
    justifyContent?: string
    alignItems?: string
    width?: string
  }
}

export interface LandingPageMeta {
  title?: string
  description?: string
  keywords?: string
  ogImage?: string
}

export interface LandingPage {
  id: string
  name: string
  sections: Section[]
  theme: {
    colorPalette: ColorPalette
    fontFamily: FontFamily
    globalSpacing: {
      padding: string
      margin: string
    }
  }
  header?: {
    logo?: string
    menu?: MenuItem[]
    actionButton?: ButtonElement
  }
  footer?: {
    logo?: string
    links?: MenuItem[]
    socialMedia?: SocialMedia[]
    legalInfo?: string
  }
  meta?: LandingPageMeta
  createdAt: string
  updatedAt: string
}

export interface MenuItem {
  label: string
  href: string
}

export interface SocialMedia {
  platform: string
  url: string
  icon?: string
}

export interface HistoryState {
  pages: LandingPage[]
  currentIndex: number
}

