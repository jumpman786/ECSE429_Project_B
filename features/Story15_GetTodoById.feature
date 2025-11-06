Feature: Mark TODO as not done
  As a student
  I want to undo completion on a task
  So I can fix mistakes

  Background:
    Given the server is running
    And TODOs with the following details exist
      | title       | doneStatus | description |
      | Fix report  | true       | finalize    |
      | Read notes  | false      | ch3         |

  Scenario: Normal - mark an already-done task back to not done
    When the student marks TODO "Fix report" as not done
    Then TODO "Fix report" has doneStatus "false"

  Scenario: Alternate - marking an already not done task keeps it not done
    When the student marks TODO "Read notes" as not done
    Then TODO "Read notes" has doneStatus "false"

  Scenario: Error - invalid id for not-done
    When the student marks TODO id "999999" as not done
    Then the student is notified of a 404 or 400 error
