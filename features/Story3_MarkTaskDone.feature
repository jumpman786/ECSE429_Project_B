Feature: Mark TODO done
  As a student
  I want to mark a task as done
  So I can track completion

  Background:
    Given the server is running
    And TODOs with the following details exist
      | title        | doneStatus | description  |
      | Read Act 1   | false      | Shakespeare  |
      | Submit lab   | true       | already done |

  Scenario: Normal - mark an undone task as done
    When the student marks TODO "Read Act 1" as done
    Then TODO "Read Act 1" has doneStatus "true"

  Scenario: Alternate - marking an already done task keeps it done
    When the student marks TODO "Submit lab" as done
    Then TODO "Submit lab" has doneStatus "true"

  Scenario: Error - invalid id
    When the student marks TODO id "999999" as done
    Then the student is notified of a 404 or 400 error
