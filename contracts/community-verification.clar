;; Community Verification Contract
;; Validates legitimate indigenous groups

(define-data-var admin principal tx-sender)

;; Community structure
(define-map communities
  { community-id: uint }
  {
    name: (string-utf8 100),
    representative: principal,
    members-count: uint,
    verified: bool,
    verification-date: (optional uint)
  }
)

;; Community ID counter
(define-data-var community-counter uint u0)

;; Check if caller is admin
(define-private (is-admin)
  (is-eq tx-sender (var-get admin))
)

;; Register a new community
(define-public (register-community
    (name (string-utf8 100))
    (representative principal)
    (members-count uint))
  (begin
    (let ((community-id (+ (var-get community-counter) u1)))
      (map-set communities
        { community-id: community-id }
        {
          name: name,
          representative: representative,
          members-count: members-count,
          verified: false,
          verification-date: none
        }
      )
      (var-set community-counter community-id)
      (ok community-id)
    )
  )
)

;; Verify a community
(define-public (verify-community (community-id uint))
  (begin
    (asserts! (is-admin) (err u403))
    (match (map-get? communities { community-id: community-id })
      community (begin
        (map-set communities
          { community-id: community-id }
          (merge community {
            verified: true,
            verification-date: (some block-height)
          })
        )
        (ok true)
      )
      (err u404)
    )
  )
)

;; Get community details
(define-read-only (get-community (community-id uint))
  (map-get? communities { community-id: community-id })
)

;; Check if community is verified
(define-read-only (is-verified (community-id uint))
  (match (map-get? communities { community-id: community-id })
    community (get verified community)
    false
  )
)

;; Transfer admin rights
(define-public (transfer-admin (new-admin principal))
  (begin
    (asserts! (is-admin) (err u403))
    (var-set admin new-admin)
    (ok true)
  )
)
