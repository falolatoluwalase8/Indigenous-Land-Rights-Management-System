;; Usage Rights Contract
;; Defines permitted activities on territories

(define-data-var admin principal tx-sender)

;; Activity types
(define-constant ACTIVITY-AGRICULTURE u1)
(define-constant ACTIVITY-HUNTING u2)
(define-constant ACTIVITY-FISHING u3)
(define-constant ACTIVITY-LOGGING u4)
(define-constant ACTIVITY-MINING u5)
(define-constant ACTIVITY-TOURISM u6)

;; Usage rights structure
(define-map usage-rights
  { territory-id: uint, activity-type: uint }
  {
    permitted: bool,
    restrictions: (string-utf8 200),
    updated-at: uint
  }
)

;; Check if caller is admin
(define-private (is-admin)
  (is-eq tx-sender (var-get admin))
)

;; Set usage rights for a territory
(define-public (set-usage-rights
    (territory-id uint)
    (activity-type uint)
    (permitted bool)
    (restrictions (string-utf8 200)))
  (begin
    (asserts! (is-admin) (err u403))
    (map-set usage-rights
      { territory-id: territory-id, activity-type: activity-type }
      {
        permitted: permitted,
        restrictions: restrictions,
        updated-at: block-height
      }
    )
    (ok true)
  )
)

;; Get usage rights for a territory and activity
(define-read-only (get-usage-rights (territory-id uint) (activity-type uint))
  (map-get? usage-rights { territory-id: territory-id, activity-type: activity-type })
)

;; Check if an activity is permitted on a territory
(define-read-only (is-activity-permitted (territory-id uint) (activity-type uint))
  (match (map-get? usage-rights { territory-id: territory-id, activity-type: activity-type })
    rights (get permitted rights)
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
