Feature: Categorize TODOs by Priority

  As a student, I categorize tasks as HIGH, MEDIUM or LOW priority, so I can better manage my time.

  Background: Server is running, TODOs and HIGH, MEDIUM, and LOW priority categories are created
    Given the server is running
    And TODOs with the following details exist
      | title                  | doneStatus | description       |
      | Work on group project  | false      | setup the project |
      | Finish webwork         | false      | 3 problems left   |
      | Do Shakespeare Reading | false      | Act 1 only        |

  Scenario Outline: Assigning HIGH, MEDIUM, or LOW priority to a TODO (Normal Flow)
    Given a category with title <priority> exists
    When a student assigns priority <priority> to the todo with title <title>
    Then the todo with title <title> is now classified as priority <priority>
    And the student is notified of the completion of the creation operation

    Examples:
      | title                    | doneStatus | description       | priority |
      | "Work on group project"  | false      | setup the project | "LOW"    |
      | "Finish webwork"         | false      | 3 problems left   | "MEDIUM" |
      | "Do Shakespeare Reading" | false      | Act 1 only        | "HIGH"   |

  Scenario Outline: Assigning HIGH, MEDIUM, or LOW priority to a TODO after creating a Priority Category (Alternate Flow)
    Given the student creates a category with title <priority>
    When a student assigns priority <priority> to the todo with title <title>
    Then the todo with title <title> is now classified as priority <priority>
    And the student is notified of the completion of the creation operation

    Examples:
      | title                    | doneStatus | description       | priority |
      | "Work on group project"  | false      | setup the project | "LOW"    |
      | "Finish webwork"         | false      | 3 problems left   | "MEDIUM" |
      | "Do Shakespeare Reading" | false      | Act 1 only        | "HIGH"   |

  Scenario Outline: Assigning HIGH, MEDIUM, or LOW priority to a non-existing TODO (Error Flow)
    Given a TODO with id <non_existing_id> does not exist
    And a category with title <priority> exists
    When a student assigns priority <priority> to the todo with id <non_existing_id>
    Then the student is notified of the non-existence error with a message <message>

    Examples:
      | non_existing_id | priority | message                                                            |
      | "50"            | "HIGH"   | "Could not find parent thing for relationship todos/50/categories" |
