;; Benefit Sharing Contract
;; Manages compensation for resource extraction

(define-data-var admin principal tx-sender)

;; Benefit agreement structure
(define-map benefit-agreements
  { agreement-id: uint }
  {
    territory-id: uint,
    community-id: uint,
    company: principal,
    activity-type: uint,
    compensation-amount: uint,
    compensation-frequency: uint,
    start-height: uint,
    end-height: (optional uint),
    active: bool
  }
)

;; Payment records
(define-map payments
  { agreement-id: uint, payment-id: uint }
  {
    amount: uint,
    paid-at: uint,
    received-by: principal
  }
)

;; Agreement ID counter
(define-data-var agreement-counter uint u0)

;; Payment ID counter per agreement
(define-map payment-counters
  { agreement-id: uint }
  { counter: uint }
)

;; Check if caller is admin
(define-private (is-admin)
  (is-eq tx-sender (var-get admin))
)

;; Create a new benefit agreement
(define-public (create-agreement
    (territory-id uint)
    (community-id uint)
    (company principal)
    (activity-type uint)
    (compensation-amount uint)
    (compensation-frequency uint))
  (begin
    (asserts! (is-admin) (err u403))
    (let ((agreement-id (+ (var-get agreement-counter) u1)))
      (map-set benefit-agreements
        { agreement-id: agreement-id }
        {
          territory-id: territory-id,
          community-id: community-id,
          company: company,
          activity-type: activity-type,
          compensation-amount: compensation-amount,
          compensation-frequency: compensation-frequency,
          start-height: block-height,
          end-height: none,
          active: true
        }
      )
      (map-set payment-counters
        { agreement-id: agreement-id }
        { counter: u0 }
      )
      (var-set agreement-counter agreement-id)
      (ok agreement-id)
    )
  )
)

;; Record a payment for an agreement
(define-public (record-payment
    (agreement-id uint)
    (amount uint)
    (received-by principal))
  (begin
    (asserts! (is-admin) (err u403))
    (match (map-get? benefit-agreements { agreement-id: agreement-id })
      agreement (begin
        (asserts! (get active agreement) (err u403))
        (match (map-get? payment-counters { agreement-id: agreement-id })
          counter-data (let ((payment-id (+ (get counter counter-data) u1)))
            (map-set payments
              { agreement-id: agreement-id, payment-id: payment-id }
              {
                amount: amount,
                paid-at: block-height,
                received-by: received-by
              }
            )
            (map-set payment-counters
              { agreement-id: agreement-id }
              { counter: payment-id }
            )
            (ok payment-id)
          )
          (err u404)
        )
      )
      (err u404)
    )
  )
)

;; End an agreement
(define-public (end-agreement (agreement-id uint))
  (begin
    (asserts! (is-admin) (err u403))
    (match (map-get? benefit-agreements { agreement-id: agreement-id })
      agreement (begin
        (map-set benefit-agreements
          { agreement-id: agreement-id }
          (merge agreement {
            end-height: (some block-height),
            active: false
          })
        )
        (ok true)
      )
      (err u404)
    )
  )
)

;; Get agreement details
(define-read-only (get-agreement (agreement-id uint))
  (map-get? benefit-agreements { agreement-id: agreement-id })
)

;; Get payment details
(define-read-only (get-payment (agreement-id uint) (payment-id uint))
  (map-get? payments { agreement-id: agreement-id, payment-id: payment-id })
)

;; Transfer admin rights
(define-public (transfer-admin (new-admin principal))
  (begin
    (asserts! (is-admin) (err u403))
    (var-set admin new-admin)
    (ok true)
  )
)
