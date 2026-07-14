import { useEffect, useState } from 'react'
import { DialogContent } from './ui/dialog'
import VotePayCard from './VotePayCard'
import VoteUSSD from './VoteUSSD';
import VoteEnded from './VoteEnded';
import NomineeCard from './NomineeCard';
import VotePay from './VotePay';
import VoteSuccess from './VoteSuccess';
import { modalPage, type ModalNominee, type ModalPage, type ModalReceipt, type ModalState } from '#/lib/utils';

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
      <Page page={page} nominee={modal.nominee ?? null} receipt={modal.receipt ?? null} />
    </DialogContent>
  )
}

function Page({ page, nominee, receipt }: { page: ModalPage; nominee: ModalNominee | null; receipt: ModalReceipt | null }) {
  if (page === 'card') {
    return (
      <VotePayCard
        nominee={nominee}
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
  if (page === 'checkout') {
    return (
      <VotePay
        nominee={nominee}
        onBack={() =>
          modalPage.setState((prev) => ({
            ...prev,
            page: 'card',
            size: 'lg',
          }))
        }
        onSuccess={(newReceipt) =>
          modalPage.setState((prev) => ({
            ...prev,
            page: 'success',
            size: 'lg',
            open: true,
            receipt: newReceipt,
          }))
        }
      />
    )
  }
  if (page === 'ussd') {
    return (
      <VoteUSSD
        nominee={nominee}
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
  if (page === 'success') return <VoteSuccess nominee={nominee} receipt={receipt} />
  if (page === 'ended') return <VoteEnded />
  if (page === 'profile') return <NomineeCard nominee={nominee} />
  return null
}
