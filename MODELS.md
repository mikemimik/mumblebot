USER
  - session: Number
  - name: String
  - id: Number
  - channel: CHANNEL

CHANNEL
  - links: []
  - children: []
  - users: USER[]
  - parent: CHANNEL
  - id: Number
  - name: String
  - temporary: Boolean
  - position: Number
  - _events: Object
  - permissions: Object

CLIENT

EVENTS
  - message ->
    - message: String
    - user: USER
    - scope: String
  - user-connect ->
    - user: USER
  - user-* ->
    - user: USER
    - params: arguments - The original event arguments
  - channel-* ->
    - channel: CHANNEL
    - params: arguments - The original event arguments
