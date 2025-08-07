# Documentation Strategy for Adobe Standards Refactoring

## Current Documentation Conflicts Identified

### **Major Conflicts Between DEVELOPMENT-GUIDE.md and .cursorrules:**

1. **Authentication Method**:
   - **DEVELOPMENT-GUIDE.md**: Claims admin token authentication
   - **.cursorrules**: Extensively documents OAuth 1.0 patterns
   - **Reality**: Based on code analysis, uses admin token authentication
   - **Resolution**: Update both to reflect admin token authentication

2. **Action Patterns**:
   - **DEVELOPMENT-GUIDE.md**: Documents simplified Adobe standard patterns
   - **.cursorrules**: Documents complex `createAction` factory patterns
   - **Reality**: Current code uses over-engineered factory patterns
   - **Resolution**: Both should migrate to Adobe standard patterns

3. **Step Functions**:
   - **DEVELOPMENT-GUIDE.md**: Mentions step functions but doesn't emphasize them
   - **.cursorrules**: Heavily emphasizes `buildProducts`, `createCsv`, `storeCsv` reuse
   - **Reality**: These are valuable business logic, should be preserved
   - **Resolution**: Preserve valuable step functions, eliminate factory abstractions

### **Conflicts in docs/ Directory:**

1. **docs/development/coding-standards.md**:
   - References `createAction` patterns (lines 621, 712)
   - Needs update to Adobe standard patterns

2. **docs/architecture/true-mesh-pattern.md**:
   - References OAuth 1.0 (line 25, 131, 374)
   - Needs correction to admin token authentication

3. **docs/architecture/project-structure.md**:
   - References "step functions" structure (line 75)
   - Needs update for simplified structure

## Unified Documentation Strategy

### **1. Documentation Hierarchy**

```text
DEVELOPMENT-GUIDE.md         # Primary development guide
├── Focus: Adobe standard patterns
├── Audience: AI assistance
└── Content: Implementation patterns, critical rules

.cursorrules                 # Development guidelines for human developers  
├── Focus: Current project context & conventions
├── Audience: Human developers, Cursor IDE
└── Content: Project-specific patterns, architecture decisions

docs/                        # Comprehensive documentation
├── Focus: Complete project documentation
├── Audience: Team members, future maintainers
└── Content: Architecture, setup, deployment, troubleshooting

REFACTORING-PROGRESS.md     # Progress tracking
├── Focus: Current refactoring effort
├── Audience: Project stakeholders
└── Content: Progress, metrics, blockers
```

### **2. Content Allocation Strategy**

#### **DEVELOPMENT-GUIDE.md Should Contain:**

- Adobe App Builder standard patterns
- Critical implementation rules
- Essential commands and workflows
- Architecture overview
- Common pitfalls to avoid

#### **.cursorrules Should Contain:**

- Current project-specific conventions
- Immediate development context
- Code style preferences
- Project structure rules
- Team-specific patterns

#### **docs/ Should Contain:**

- Detailed architecture explanations
- Setup and deployment guides
- Troubleshooting information
- API documentation
- Historical context and decisions

### **3. Migration Plan for Documentation**

#### **Phase 1: Align Core Documentation (Week 1)**

**Update DEVELOPMENT-GUIDE.md**:

```markdown
# Priority fixes:
- ✅ Correct authentication method (admin token, not OAuth)
- ✅ Document Adobe standard action patterns  
- ✅ Simplify configuration guidance
- ✅ Remove over-engineering patterns
- ✅ Add Adobe SDK direct usage patterns
```

**Update .cursorrules**:

```markdown  
# Priority fixes:
- ❌ Remove OAuth 1.0 references → ✅ Admin token authentication
- ❌ Remove createAction factory patterns → ✅ Adobe standard exports.main
- ❌ Remove complex step function orchestration → ✅ Simplified business logic
- ✅ Keep valuable business logic patterns (buildProducts, createCsv)
- ✅ Update project structure to simplified architecture
```

#### **Phase 2: Update docs/ Directory (Week 2-3)**

**Files Requiring Updates**:

1. `docs/development/coding-standards.md`
   - Remove `createAction` references
   - Add Adobe standard action patterns
   - Update error handling to Adobe patterns

2. `docs/architecture/true-mesh-pattern.md`
   - Correct authentication documentation
   - Update to reflect simplified patterns

3. `docs/architecture/project-structure.md`
   - Update directory structure
   - Remove over-engineered components
   - Document simplified architecture

4. `docs/development/api-mesh-integration.md`
   - Update to use `graphql-request` directly
   - Remove custom query builder documentation

#### **Phase 3: Create Migration Documentation (Week 4)**

**New Documentation Files**:

1. `MIGRATION-GUIDE.md` - Guide for understanding changes
2. `ADOBE-STANDARDS.md` - Documentation of Adobe patterns adopted
3. `ARCHITECTURE-DECISIONS.md` - Record of simplification decisions

### **4. Conflict Resolution Rules**

#### **During Refactoring:**

1. **DEVELOPMENT-GUIDE.md takes precedence** for implementation patterns
2. **.cursorrules should reflect current reality** (update as code changes)
3. **docs/ should be comprehensive** but defer to DEVELOPMENT-GUIDE.md for patterns
4. **REFACTORING-PROGRESS.md tracks the transition**

#### **After Refactoring:**

1. **DEVELOPMENT-GUIDE.md becomes the definitive pattern guide**
2. **.cursorrules reflects the new simplified architecture**
3. **docs/ provides comprehensive context and explanation**
4. **Legacy documentation moved to docs/legacy/ for reference**

### **5. Maintenance Strategy**

#### **Weekly Reviews During Refactoring:**

- [ ] Check documentation alignment with current code state
- [ ] Update progress tracking
- [ ] Resolve any new conflicts that emerge
- [ ] Validate documentation accuracy against working code

#### **Post-Refactoring Maintenance:**

- [ ] Monthly review of documentation accuracy
- [ ] Update documentation when patterns change
- [ ] Maintain alignment between DEVELOPMENT-GUIDE.md and .cursorrules
- [ ] Archive outdated patterns in docs/legacy/

### **6. Implementation Checklist**

#### **Week 1: Core Alignment**

- [ ] Update DEVELOPMENT-GUIDE.md authentication section
- [ ] Update .cursorrules to remove OAuth references  
- [ ] Align action pattern documentation
- [ ] Create REFACTORING-PROGRESS.md tracking

#### **Week 2: Extended Documentation**

- [ ] Update docs/development/coding-standards.md
- [ ] Update docs/architecture/ files
- [ ] Remove conflicting pattern references
- [ ] Add Adobe standard pattern examples

#### **Week 3: Comprehensive Review**

- [ ] Full documentation audit
- [ ] Resolve remaining conflicts
- [ ] Test documentation against actual code
- [ ] Create migration guide

#### **Week 4: Finalization**

- [ ] Create final consolidated documentation
- [ ] Archive legacy documentation
- [ ] Validate all documentation sources align
- [ ] Create maintenance procedures

## Success Criteria

### **Documentation Alignment Achieved When:**

1. ✅ No conflicts between DEVELOPMENT-GUIDE.md and .cursorrules
2. ✅ All documentation reflects actual code patterns
3. ✅ Adobe standard patterns consistently documented
4. ✅ Clear hierarchy and purpose for each documentation type
5. ✅ Maintenance procedures in place

### **Quality Metrics:**

- **Consistency**: All docs use same terminology and patterns
- **Accuracy**: Documentation matches actual implementation  
- **Completeness**: All essential patterns documented
- **Clarity**: Clear purpose and audience for each document
- **Maintainability**: Easy to keep documentation current

---

**This strategy ensures documentation supports rather than conflicts with the refactoring effort while maintaining clarity for both AI assistance and human developers.**
