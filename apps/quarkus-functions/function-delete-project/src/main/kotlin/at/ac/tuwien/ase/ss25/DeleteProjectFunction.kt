package at.ac.tuwien.ase.ss25

import io.quarkus.funqy.Funq
import jakarta.inject.Inject
import jakarta.persistence.EntityManager
import jakarta.transaction.Transactional
import org.eclipse.microprofile.jwt.JsonWebToken
import java.util.*

class DeleteProjectFunction {

    @Inject
    lateinit var jwt: JsonWebToken

    @Inject
    lateinit var em: EntityManager

    @Funq
    @Transactional
    fun delete(id: UUID) {
        em.createQuery("DELETE FROM Project p WHERE p.userId=:sub AND p.extId=:id")
            .setParameter("sub", UUID.fromString(jwt.subject))
            .setParameter("id", id)
            .executeUpdate()
    }
}