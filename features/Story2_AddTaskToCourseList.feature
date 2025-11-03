Feature: Add a Task to a Course Todo List

  As a student, I add a task to a course to do list, so I can remember it.

  Background: Server is running, TODOs and course todo list projects are created
    Given the server is running
    And TODOs with the following details exist
      | title                  | doneStatus | description       |
      | Work on group project  | false      | setup the project |
      | Finish webwork         | false      | 3 problems left   |
      | Do Shakespeare Reading | false      | Act 1 only        |
    And course todo list projects with the following details exist
      | title       | completed | description  | active |
      | MATH 141    | false     | Calc 2       | true   |
      | ENGL 202    | false     | Literature   | true   |

  Scenario Outline: Add a task to a course todo list (Normal Flow)
    When a student adds a TODO with title <title> to a course todo list with name <course>
    Then the TODO with title <title> is added as a task of the course todo list with name <course>
    And the student is notified of the completion of the creation operation

    Examples:
      | title                    | doneStatus | description       | course      |
      | "Finish webwork"         | false      | 3 problems left   | "MATH 141"  |
      | "Do Shakespeare Reading" | false      | Act 1 only        | "ENGL 202"  |

  Scenario Outline: Add a task after creating the course todo list (Alternate Flow)
    Given the student creates a course todo list with name <course> and description <description>
    When a student adds a TODO with title <title> to a course todo list with name <course>
    Then the TODO with title <title> is added as a task of the course todo list with name <course>
    And the student is notified of the completion of the creation operation

    Examples:
      | title                   | doneStatus | course        | description     |
      | "Work on group project" | false      | "ECSE 321"    | "Intro to SE"   |

  Scenario Outline: Add a non-existing task to a course todo list (Error Flow)
    Given a TODO with id <non_existing_id> does not exist
    When a student adds a TODO with id <non_existing_id> to a course todo list with name <course>
    Then the student is notified of the non-existence error with a message <message>

    Examples:
      | non_existing_id | course      | message                                                         |
      | "50"            | "MATH 141"  | "Could not find parent thing for relationship todos/50/tasksof" |
