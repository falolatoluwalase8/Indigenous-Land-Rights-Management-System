;; Territory Mapping Contract
;; Records boundaries of traditional lands

(define-data-var admin principal tx-sender)

;; Territory structure
(define-map territories
  { territory-id: uint }
  {
    name: (string-utf8 100),
    boundaries: (list 10 {
      latitude: int,
      longitude: int
    }),
    community-id: uint,
    registered-at: uint
  }
)

;; Territory ID counter
(define-data-var territory-counter uint u0)

;; Check if caller is admin
(define-private (is-admin)
  (is-eq tx-sender (var-get admin))
)

;; Register a new territory
(define-public (register-territory
    (name (string-utf8 100))
    (boundaries (list 10 {
      latitude: int,
      longitude: int
    }))
    (community-id uint))
  (begin
    (asserts! (is-admin) (err u403))
    (let ((territory-id (+ (var-get territory-counter) u1)))
      (map-set territories
        { territory-id: territory-id }
        {
          name: name,
          boundaries: boundaries,
          community-id: community-id,
          registered-at: block-height
        }
      )
      (var-set territory-counter territory-id)
      (ok territory-id)
    )
  )
)

;; Get territory details
(define-read-only (get-territory (territory-id uint))
  (map-get? territories { territory-id: territory-id })
)

;; Transfer admin rights
(define-public (transfer-admin (new-admin principal))
  (begin
    (asserts! (is-admin) (err u403))
    (var-set admin new-admin)
    (ok true)
  )
)
