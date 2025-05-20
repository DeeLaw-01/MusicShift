import { Link } from 'wouter'
import { Button } from '@/components/ui/button'
import { Menu, Music } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { useMobile } from '@/hooks/use-mobile'

export default function Header () {
  const isMobile = useMobile()

  const NavLinks = () => <></>

  return (
    <header className='bg-primary text-white shadow-md'>
      <div className='container mx-auto px-4 py-4 flex justify-between items-center'>
        <Link href='/' className='flex items-center'>
          <Music className='h-6 w-6 mr-2' />
          <h1 className='text-2xl font-semibold'>SoundShift</h1>
        </Link>

        {!isMobile ? (
          <div className='flex items-center space-x-4'>
            <NavLinks />
          </div>
        ) : (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant='ghost' size='icon'>
                <Menu className='h-6 w-6' />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <div className='flex flex-col space-y-4 mt-8'>
                <NavLinks />
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>
    </header>
  )
}
