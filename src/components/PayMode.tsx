import { useEffect, useState } from 'react'
import { DialogContent } from './ui/dialog'
import VotePayCard from './VotePayCard'
import VoteUSSD from './VoteUSSD';
import VoteEnded from './VoteEnded';
import NomineeCard from './NomineeCard';
import { modalPage, type ModalPage, type ModalState } from '#/lib/utils';

export default function PayMode() {
  const [modal, setModal] = useState<ModalState>(() => modalPage.state)

  useEffect(() => {
    const sub = modalPage.subscribe((value) => {
      setModal(value)
    })
    return () => sub.unsubscribe()
  }, [])

  const page: ModalPage = modal.page ?? 'card'
  
  return (
    <DialogContent className={`p-0 max-h-[90vh] overflow-hidden`}>
      <Page page={page} />
    </DialogContent>
  )
}

function Page({ page }: { page: ModalPage }) {
  if (page === 'card') {
    return (
      <VotePayCard
        onSelectMode={(next) =>
          modalPage.setState((prev) => ({
            ...prev,
            page: next,
            size: 'lg',
          }))
        }
      />
    )
  }
  if (page === 'ussd') {
    return (
      <VoteUSSD
        onBack={() =>
          modalPage.setState((prev) => ({
            ...prev,
            page: 'card',
            size: 'lg',
          }))
        }
      />
    )
  }
  if (page === 'ended') return <VoteEnded />
  if (page === 'stack') return <VoteEnded />
  if (page === 'profile') return <NomineeCard />
  return null
}
