# PR #148 Findings

The following findings were identified while reviewing PR #148 (`feature/medical-record`):

1. The `PATCH /api/animals/:aid` flow is not atomic. The implementation updates the base animal record first and then deletes or rewrites medical records in a separate step. If the medical-record sync fails after the animal update succeeds, the API returns an error even though part of the mutation has already been committed.

2. Optional medical-record fields cannot be cleared once populated. Blank `date_given`, `vet_name`, and `notes` values are removed during validation and normalization before persistence, so submitting an edited record with those fields intentionally emptied leaves the old database values in place instead of clearing them.