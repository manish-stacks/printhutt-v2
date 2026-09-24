import CustomizeShell from '@/components/customize/CustomizeShell';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <CustomizeShell>{children}</CustomizeShell>;
}
